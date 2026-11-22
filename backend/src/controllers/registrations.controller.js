import Event, { canRegisterFor, canManageEventMedia, hasEventEnded } from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import Media from "../models/Media.js";
import User, { missingProfileFields } from "../models/User.js";
import { logActivity } from "../utils/activityLog.js";
import { performCheckIn, seatsTaken } from "../services/registrationService.js";

const formatError = (code, message) => ({ error: { code, message } });

const toMediaDTO = (doc) => ({
  id: doc._id,
  eventId: doc.eventId,
  url: doc.url,
  thumbnailUrl: doc.thumbnailUrl,
  type: doc.type,
  caption: doc.caption,
  createdAt: doc.createdAt,
});

/**
 * What the guest is allowed to see of their own registration. The codes are
 * omitted entirely until an admin approves, so a pending or rejected guest has
 * nothing to present - the door check is not the only thing standing between
 * them and entry.
 */
const toMyRegistrationDTO = (r) => {
  const base = {
    id: r._id,
    eventId: r.eventId,
    registeredAt: r.registeredAt,
    approvalStatus: r.approvalStatus || "pending",
    decidedAt: r.decidedAt || null,
    decisionNote: r.decisionNote || "",
    attended: r.attended,
    checkedInAt: r.checkedInAt || null,
    planName: r.planName || "",
    amountDue: r.amountDue ?? null,
    currency: r.currency || "",
    paymentStatus: r.paymentStatus,
    paymentReference: r.paymentReference || "",
  };
  if (r.approvalStatus !== "approved") return base;
  return { ...base, registrationCode: r.registrationCode, qrToken: r.qrToken };
};

export const registerForEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;
    const { planId, paymentReference } = req.body || {};

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json(formatError("NOT_FOUND", "Event not found"));

    // Drafts and completed events are not taking registrations.
    if (!canRegisterFor(event)) {
      const message =
        event.status === "completed" || hasEventEnded(event)
          ? "This event has finished, so registration is closed."
          : "Registration is not open for this event yet.";
      return res.status(403).json(formatError("REGISTRATION_CLOSED", message));
    }

    // Organisers need a full profile on file before anyone takes a place, so
    // this is enforced here rather than only in the UI.
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json(formatError("NOT_FOUND", "User not found"));

    const missing = missingProfileFields(user);
    if (missing.length > 0) {
      return res.status(403).json({
        error: {
          code: "PROFILE_INCOMPLETE",
          message: "Complete your profile before registering for an event.",
          missingProfileFields: missing,
        },
      });
    }

    let registration = await EventRegistration.findOne({ eventId, userId });
    if (registration) {
      return res.json({ registration: toMyRegistrationDTO(registration) });
    }

    // Premium events require a plan choice up front; it is snapshotted onto
    // the registration so later edits to the event's plans can't change what
    // this guest already committed (and, once paid, already paid) to.
    let planFields = {};
    if (event.isPremium) {
      const plan = (event.plans || []).find((p) => String(p._id) === String(planId));
      if (!plan) {
        return res.status(400).json(formatError("VALIDATION_ERROR", "Choose a valid participation plan"));
      }
      planFields = {
        planId: plan._id,
        planName: plan.name,
        amountDue: plan.price,
        currency: event.currency || "USD",
        // A free plan owes nothing, so there is no payment for an admin to
        // confirm; leaving it pending would lock the guest out at the door.
        paymentStatus: plan.price === 0 ? "paid" : "pending",
        paymentMethod: "manual",
        paymentReference: (paymentReference || "").trim(),
      };
    }

    // Capacity is checked after the duplicate and plan checks so a repeat
    // request never reports "full" to someone who already holds a place.
    if (event.capacity && (await seatsTaken(eventId)) >= event.capacity) {
      return res.status(409).json(formatError("EVENT_FULL", "This event is full. There are no places left."));
    }

    // No codes yet. A registration starts as a request; an admin decides, and
    // approval is what issues the code and QR token.
    registration = await EventRegistration.create({
      eventId,
      userId,
      approvalStatus: "pending",
      attended: false,
      ...planFields,
    });

    await logActivity({
      actor: { userId, role: req.user.role, email: req.user.email },
      action: "registration.requested",
      summary: `${user.fullName} requested a place at "${event.title}"`,
      targetType: "registration",
      targetId: registration._id,
      targetLabel: user.fullName,
    });

    return res.status(201).json({ registration: toMyRegistrationDTO(registration) });
  } catch (err) {
    return next(err);
  }
};

export const getMyRegistration = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;
    const [registration, event] = await Promise.all([
      EventRegistration.findOne({ eventId, userId }).lean(),
      Event.findById(eventId).select("title location startDateTime endDateTime isPremium currency").lean(),
    ]);
    if (!registration) {
      return res.status(404).json(formatError("NOT_REGISTERED", "No registration for this event"));
    }
    return res.json({
      registration: toMyRegistrationDTO(registration),
      event: event
        ? {
            id: event._id,
            title: event.title,
            location: event.location,
            startDateTime: event.startDateTime,
            endDateTime: event.endDateTime,
            isPremium: event.isPremium,
            currency: event.currency,
          }
        : null,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * A guest withdrawing their own registration, which frees the seat. Refused once
 * they have been checked in (attendance is a fact) or the event is over.
 */
export const cancelMyRegistration = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const registration = await EventRegistration.findOne({ eventId, userId: req.user.userId });
    if (!registration) {
      return res.status(404).json(formatError("NOT_REGISTERED", "No registration for this event"));
    }
    if (registration.attended) {
      return res.status(409).json(formatError("ALREADY_CHECKED_IN", "You have already attended this event, so it cannot be cancelled."));
    }
    // A rejection is the organiser's final decision for this event; letting a
    // guest delete it would let them wipe the rejection and re-register.
    if (registration.approvalStatus === "rejected") {
      return res.status(409).json(formatError("REJECTED_REGISTRATION", "This registration was not approved and cannot be cancelled."));
    }
    const event = await Event.findById(eventId).select("title endDateTime").lean();
    if (event && hasEventEnded(event)) {
      return res.status(409).json(formatError("EVENT_ENDED", "This event has finished, so the registration can no longer be cancelled."));
    }
    // A paid ticket is money the admin must deal with, so it cannot just vanish.
    if (registration.paymentStatus === "paid" && registration.amountDue > 0) {
      return res.status(409).json(formatError("PAID_REGISTRATION", "This registration has been paid. Contact the organizer to cancel and arrange a refund."));
    }

    await registration.deleteOne();
    await logActivity({
      actor: req.user,
      action: "registration.cancelled",
      summary: `A guest cancelled their registration for "${event?.title || "an event"}"`,
      targetType: "registration",
      targetId: registration._id,
      targetLabel: event?.title || "",
    });
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
};

/**
 * Lets a guest submit or update their payment reference (e.g. EVC Plus, Zaad,
 * Sahal, eDahab, or bank transfer ID) after reserving a seat on a paid event.
 */
export const updateMyPaymentReference = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const ref = String(req.body?.paymentReference || "").trim();
    if (!ref) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "Enter a payment reference or transaction ID."));
    }
    if (ref.length > 120) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "Payment reference is too long."));
    }

    const [registration, event] = await Promise.all([
      EventRegistration.findOne({ eventId, userId: req.user.userId }),
      Event.findById(eventId).select("title isPremium").lean(),
    ]);
    if (!registration) {
      return res.status(404).json(formatError("NOT_REGISTERED", "No registration for this event"));
    }
    if (!event?.isPremium || !(registration.amountDue > 0)) {
      return res.status(400).json(formatError("NOT_PREMIUM", "This registration does not require payment."));
    }
    if (registration.approvalStatus === "rejected") {
      return res.status(409).json(formatError("REJECTED_REGISTRATION", "This registration was not approved."));
    }
    if (registration.paymentStatus === "paid") {
      return res.status(409).json(formatError("ALREADY_PAID", "Your payment has already been confirmed."));
    }

    registration.paymentReference = ref;
    await registration.save();

    await logActivity({
      actor: req.user,
      action: "registration.payment_reference_updated",
      summary: `Submitted payment reference "${ref}" for "${event.title}"`,
      targetType: "registration",
      targetId: registration._id,
      targetLabel: event.title,
    });

    return res.json({ registration: toMyRegistrationDTO(registration) });
  } catch (err) {
    return next(err);
  }
};

export const checkIn = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { registrationCode, qrToken } = req.body || {};
    if (!registrationCode && !qrToken) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "registrationCode or qrToken is required"));
    }

    const event = await Event.findById(eventId).select("title checkInOpen isPremium createdBy photographers").lean();
    if (!event) return res.status(404).json(formatError("NOT_FOUND", "Event not found"));

    // Being an organizer or photographer is not enough: staff can only scan at
    // events they own or are assigned to, never at someone else's door.
    if (!canManageEventMedia(event, req.user)) {
      return res.status(403).json(formatError("FORBIDDEN", "You are not assigned to this event."));
    }

    const result = await performCheckIn({ event, registrationCode, qrToken, actor: req.user });
    return res.status(result.status).json(result.body);
  } catch (err) {
    return next(err);
  }
};

export const galleryGate = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.userId;

    // The gallery used to answer from the registration row alone, so an event
    // that was no longer there kept serving its photos. Now that trashing hides
    // an event everywhere else, it has to close the gallery too.
    const event = await Event.findById(eventId).select("_id").lean();
    if (!event) return res.status(404).json(formatError("NOT_FOUND", "Event not found"));

    const registration = await EventRegistration.findOne({ eventId, userId }).lean();
    if (!registration) {
      return res.status(403).json(formatError("NOT_REGISTERED", "Please register first"));
    }
    if (!registration.attended) {
      return res.status(403).json(formatError("NOT_ATTENDED", "You must check-in at the event to view media"));
    }
    const media = await Media.find({ eventId }).sort({ createdAt: -1 }).lean();
    return res.json({ media: media.map(toMediaDTO) });
  } catch (err) {
    return next(err);
  }
};

export default {
  registerForEvent,
  getMyRegistration,
  cancelMyRegistration,
  updateMyPaymentReference,
  checkIn,
  galleryGate,
};
