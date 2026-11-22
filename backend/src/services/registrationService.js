import crypto from "crypto";
import EventRegistration from "../models/EventRegistration.js";
import User from "../models/User.js";
import { logActivity } from "../utils/activityLog.js";
import { sendRegistrationApprovedEmail, sendRegistrationRejectedEmail } from "../config/mailer.js";

const formatError = (code, message) => ({ error: { code, message } });

const appBaseUrl = () =>
  (process.env.APP_BASE_URL || process.env.CORS_ORIGIN || "http://localhost:5173").replace(/\/+$/, "");

const generateRegistrationCode = () => `EVT-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
const generateQrToken = () => crypto.randomBytes(32).toString("hex");

/** Seats in use: everyone who has not been turned away. */
export const seatsTaken = (eventId) =>
  EventRegistration.countDocuments({ eventId, approvalStatus: { $ne: "rejected" } });

/** Seats left, or null when the event has no capacity limit. */
export const seatsLeft = async (event) => {
  if (!event?.capacity) return null;
  return Math.max(0, event.capacity - (await seatsTaken(event._id)));
};

/**
 * The single place an admin or organizer decision is applied, so both consoles
 * behave identically: codes issued on approval and revoked otherwise, capacity
 * respected when someone is let back in, the guest emailed, the action logged.
 * Returns `{ error, status }` on refusal, or `{ registration, emailDelivered }`.
 */
export const decideRegistration = async ({ event, registration, approvalStatus, note = "", actor }) => {
  if (!["pending", "approved", "rejected"].includes(approvalStatus)) {
    return { status: 400, error: formatError("VALIDATION_ERROR", "approvalStatus must be pending, approved, or rejected") };
  }

  // Someone already through the door cannot be un-approved: attendance is a
  // fact, and revoking the code would not undo it.
  if (registration.attended && approvalStatus !== "approved") {
    return { status: 409, error: formatError("ALREADY_CHECKED_IN", "This guest is already checked in, so their approval cannot be withdrawn.") };
  }

  if (event.status === "completed") {
    return { status: 409, error: formatError("EVENT_COMPLETED", "This event is completed, so registration decisions are locked.") };
  }

  // Moving a rejected guest back into the list takes a seat again.
  if (registration.approvalStatus === "rejected" && approvalStatus !== "rejected" && event.capacity) {
    if ((await seatsTaken(event._id)) >= event.capacity) {
      return { status: 409, error: formatError("EVENT_FULL", "This event is at capacity, so a rejected guest cannot be let back in.") };
    }
  }

  const guest = await User.findById(registration.userId).select("fullName email").lean();

  registration.approvalStatus = approvalStatus;
  registration.decidedAt = new Date();
  registration.decidedBy = actor.userId;
  registration.decisionNote = String(note || "").trim();

  if (approvalStatus === "approved") {
    // Issued once and then kept, so re-approving never invalidates a code the guest holds.
    if (!registration.registrationCode) registration.registrationCode = generateRegistrationCode();
    if (!registration.qrToken) registration.qrToken = generateQrToken();
  } else {
    registration.registrationCode = undefined;
    registration.qrToken = undefined;
  }
  await registration.save();

  let emailDelivered = false;
  if (guest?.email && approvalStatus !== "pending") {
    try {
      const result =
        approvalStatus === "approved"
          ? await sendRegistrationApprovedEmail({
              to: guest.email,
              fullName: guest.fullName,
              event,
              registrationCode: registration.registrationCode,
              qrToken: registration.qrToken,
              note: registration.decisionNote,
              statusUrl: `${appBaseUrl()}/dashboard/events/${event._id}/registration`,
            })
          : await sendRegistrationRejectedEmail({
              to: guest.email,
              fullName: guest.fullName,
              event,
              note: registration.decisionNote,
              eventsUrl: `${appBaseUrl()}/events`,
            });
      emailDelivered = !!result?.delivered;
    } catch (err) {
      // The decision stands even if the mail server is unreachable.
      console.warn("Could not email the registration decision:", err.message);
    }
  }

  await logActivity({
    actor,
    action: `registration.${approvalStatus}`,
    summary: `${approvalStatus === "approved" ? "Approved" : approvalStatus === "rejected" ? "Rejected" : "Reset to pending"} ${guest?.fullName || "a guest"} for "${event.title}"`,
    targetType: "registration",
    targetId: registration._id,
    targetLabel: guest?.fullName || "",
  });

  return { registration, emailDelivered };
};

/** Records a manual payment decision on one registration. */
export const applyPayment = async ({ event, registration, paymentStatus, paymentReference, actor }) => {
  if (!["pending", "paid", "refunded"].includes(paymentStatus)) {
    return { status: 400, error: formatError("VALIDATION_ERROR", "paymentStatus must be pending, paid, or refunded") };
  }
  if (!event.isPremium) {
    return { status: 400, error: formatError("NOT_PREMIUM", "This event is free, so there is no payment to record.") };
  }
  if (registration.approvalStatus === "rejected" && paymentStatus === "paid") {
    return { status: 409, error: formatError("REJECTED_REGISTRATION", "Cannot confirm payment on a rejected registration.") };
  }
  if (registration.attended && paymentStatus === "pending") {
    return { status: 409, error: formatError("ALREADY_CHECKED_IN", "This guest has already checked in, so payment cannot be reset to pending.") };
  }

  registration.paymentStatus = paymentStatus;
  if (paymentReference !== undefined && String(paymentReference).trim() !== "") {
    registration.paymentReference = String(paymentReference).trim();
  }
  if (paymentStatus === "paid") {
    registration.paymentConfirmedAt = new Date();
    registration.paymentConfirmedBy = actor.userId;
  } else {
    registration.paymentConfirmedAt = undefined;
    registration.paymentConfirmedBy = undefined;
  }
  await registration.save();

  await logActivity({
    actor,
    action: `registration.payment_${paymentStatus}`,
    summary: `Marked payment ${paymentStatus} on "${event.title}"`,
    targetType: "registration",
    targetId: registration._id,
    targetLabel: event.title,
  });
  return { registration };
};

/**
 * Scans one code at the door. Shared by the admin/photographer route and the
 * organizer route. The caller has already proven the actor may work this event.
 * Returns `{ status, body }` ready to send.
 */
export const performCheckIn = async ({ event, registrationCode, qrToken, actor }) => {
  if (!event.checkInOpen) {
    return { status: 403, body: formatError("CHECKIN_CLOSED", "Check-in is not open for this event yet.") };
  }

  // A blank code must never match the many registrations that hold none.
  const query = { eventId: event._id };
  if (registrationCode) query.registrationCode = String(registrationCode).trim();
  if (qrToken) query.qrToken = String(qrToken).trim();
  if (!query.registrationCode && !query.qrToken) {
    return { status: 400, body: formatError("VALIDATION_ERROR", "registrationCode or qrToken is required") };
  }

  const registration = await EventRegistration.findOne(query);
  if (!registration) {
    return { status: 404, body: formatError("INVALID_CODE", "That code is not valid for this event. Ask the guest to check their approval email.") };
  }

  const guest = await User.findById(registration.userId).select("fullName email phone").lean();
  const guestDTO = guest ? { fullName: guest.fullName, email: guest.email, phone: guest.phone || "" } : null;
  const name = guest?.fullName || "This guest";

  if (registration.approvalStatus !== "approved") {
    return {
      status: 403,
      body: formatError(
        "NOT_APPROVED",
        registration.approvalStatus === "rejected"
          ? `${name}'s registration was not approved for this event.`
          : `${name}'s registration is still awaiting approval.`
      ),
    };
  }

  if (event.isPremium && registration.paymentStatus !== "paid") {
    return { status: 403, body: formatError("PAYMENT_REQUIRED", `${name}'s payment has not been confirmed yet. Confirm payment before checking them in.`) };
  }

  if (registration.attended) {
    return {
      status: 409,
      body: { ...formatError("ALREADY_CHECKED_IN", `${name} was already checked in for this event.`), registration, guest: guestDTO },
    };
  }

  registration.attended = true;
  registration.checkedInAt = new Date();
  registration.checkedInBy = actor.userId;
  await registration.save();

  await logActivity({
    actor,
    action: "registration.checked_in",
    summary: `Checked in ${guest?.fullName || "a guest"} (${guest?.email || "?"}) to "${event.title}"`,
    targetType: "registration",
    targetId: registration._id,
    targetLabel: guest?.fullName || "",
  });

  return { status: 200, body: { registration, guest: guestDTO } };
};
