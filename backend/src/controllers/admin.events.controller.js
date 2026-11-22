import crypto from "crypto";
import mongoose from "mongoose";
import Event, { EVENT_STATUSES, TRASH_RETENTION_DAYS, trashExpiryFor, parseCapacity } from "../models/Event.js";
import User from "../models/User.js";
import Media from "../models/Media.js";
import EventRegistration from "../models/EventRegistration.js";
import { isStorageReady, removeMedia, storeMedia } from "../config/storage.js";
import { logActivity } from "../utils/activityLog.js";
import { decideRegistration, applyPayment, seatsTaken } from "../services/registrationService.js";

const formatError = (code, message) => ({ error: { code, message } });

// `published` is not in this list on purpose: the console UI only exposes
// status, and published is derived from it below rather than being settable
// independently. That derivation used to run only on create, which meant
// changing an event from draft to registration-open through the edit modal
// never flipped published - the event stayed invisible on the public site
// even though its status said otherwise. Deriving it here on every save,
// whenever status is part of the payload, closes that gap for updates too.
const validateEventPayload = (body, isUpdate = false) => {
  const allowed = [
    "title",
    "description",
    "location",
    "category",
    "startDateTime",
    "endDateTime",
    "visibility",
    "status",
    "isPremium",
    "currency",
    "plans",
    "capacity",
  ];
  const payload = {};
  allowed.forEach((key) => {
    if (body[key] !== undefined) payload[key] = body[key];
  });
  if (payload.capacity !== undefined) {
    const parsed = parseCapacity(payload.capacity);
    if (parsed.error) return { error: formatError("VALIDATION_ERROR", parsed.error) };
    payload.capacity = parsed.value;
  }
  if (payload.status && !EVENT_STATUSES.includes(payload.status)) {
    return { error: formatError("VALIDATION_ERROR", `status must be one of: ${EVENT_STATUSES.join(", ")}`) };
  }
  if (payload.visibility && !["public", "private"].includes(payload.visibility)) {
    return { error: formatError("VALIDATION_ERROR", "visibility must be public or private") };
  }
  if (payload.plans !== undefined) {
    if (!Array.isArray(payload.plans) || payload.plans.length === 0) {
      return { error: formatError("VALIDATION_ERROR", "A premium event needs at least one plan") };
    }
    const cleanPlans = [];
    for (const p of payload.plans) {
      const name = (p?.name || "").trim();
      const price = Number(p?.price);
      if (!name) return { error: formatError("VALIDATION_ERROR", "Every plan needs a name") };
      if (!Number.isFinite(price) || price < 0) {
        return { error: formatError("VALIDATION_ERROR", `Plan "${name}" needs a valid price`) };
      }
      cleanPlans.push({ name, price, description: (p?.description || "").trim() });
    }
    payload.plans = cleanPlans;
  }
  if (payload.isPremium === true && (!payload.plans || payload.plans.length === 0)) {
    return { error: formatError("VALIDATION_ERROR", "Premium events need at least one plan") };
  }
  if (!isUpdate) {
    if (!payload.title) return { error: formatError("VALIDATION_ERROR", "title is required") };
    if (!payload.startDateTime) return { error: formatError("VALIDATION_ERROR", "startDateTime is required") };
    if (!payload.endDateTime) return { error: formatError("VALIDATION_ERROR", "endDateTime is required") };
  }
  if (payload.startDateTime && payload.endDateTime) {
    if (new Date(payload.endDateTime) <= new Date(payload.startDateTime)) {
      return { error: formatError("VALIDATION_ERROR", "endDateTime must be after startDateTime") };
    }
  }
  if (!isUpdate) {
    if (!payload.visibility) payload.visibility = "public";
    if (!payload.status) payload.status = "draft";
  }
  // Keep published in lock-step with status any time status is being set,
  // on both create and update.
  if (payload.status) {
    payload.published = payload.status !== "draft";
  }
  return { payload };
};

/** Cover image for an event, stored through the same driver as event media. */
export const uploadEventCover = async (req, res, next) => {
  try {
    if (!isStorageReady) {
      return res.status(503).json(formatError("MEDIA_STORAGE_UNCONFIGURED", "Media storage is not configured"));
    }
    if (!req.file) return res.status(400).json(formatError("VALIDATION_ERROR", "file is required"));
    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "Cover must be an image"));
    }

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json(formatError("NOT_FOUND", "Event not found"));

    const stored = await storeMedia(req.file.buffer, {
      eventId: `covers/${event._id}`,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
    });

    if (event.coverImagePublicId) {
      try {
        await removeMedia(event.coverImagePublicId, "image");
      } catch (err) {
        console.warn("Could not remove previous cover:", err.message);
      }
    }

    event.coverImageUrl = stored.url;
    event.coverImagePublicId = stored.publicId;
    await event.save();

    return res.status(201).json({ coverImageUrl: event.coverImageUrl });
  } catch (err) {
    return next(err);
  }
};

const photographerDTO = (p) =>
  p && typeof p === "object" && p._id
    ? { id: p._id, fullName: p.fullName, email: p.email, avatarUrl: p.avatarUrl || "" }
    : { id: p };

export const createEvent = async (req, res, next) => {
  try {
    const { payload, error } = validateEventPayload(req.body);
    if (error) return res.status(400).json(error);
    const event = await Event.create({ ...payload, createdBy: req.user.userId, photographers: [] });

    await logActivity({
      actor: req.user,
      action: "event.created",
      summary: `Created event "${event.title}"`,
      targetType: "event",
      targetId: event._id,
      targetLabel: event.title,
    });

    return res.status(201).json(event);
  } catch (err) {
    return next(err);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const { payload, error } = validateEventPayload(req.body, true);
    if (error) return res.status(400).json(error);
    const { eventId } = req.params;

    const current = await Event.findById(eventId).select("isPremium capacity startDateTime endDateTime").lean();
    if (!current) return res.status(404).json(formatError("NOT_FOUND", "Event not found"));

    // The change a partial update can still get wrong: dates are validated as a
    // pair above only when both are sent, so check against the stored one too.
    const start = new Date(payload.startDateTime ?? current.startDateTime);
    const end = new Date(payload.endDateTime ?? current.endDateTime);
    if (end <= start) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "endDateTime must be after startDateTime"));
    }

    // Free and paid events are told apart at the door, so flipping one that
    // already has guests would strand them with the wrong payment state.
    if (payload.isPremium !== undefined && Boolean(payload.isPremium) !== current.isPremium) {
      if ((await EventRegistration.countDocuments({ eventId })) > 0) {
        return res.status(409).json(formatError("HAS_REGISTRATIONS", "This event already has registrations, so it cannot switch between free and paid."));
      }
    }

    // Capacity can never drop below the guests already holding a place.
    if (payload.capacity) {
      const taken = await seatsTaken(eventId);
      if (payload.capacity < taken) {
        return res.status(409).json(formatError("CAPACITY_TOO_LOW", `${taken} places are already taken, so capacity cannot be set below that.`));
      }
    }

    // A finished event has no door to keep open.
    if (payload.status === "completed") payload.checkInOpen = false;

    const event = await Event.findByIdAndUpdate(eventId, payload, { new: true, runValidators: true })
      .populate("photographers", "fullName email avatarUrl")
      .lean();
    if (!event) return res.status(404).json(formatError("NOT_FOUND", "Event not found"));

    await logActivity({
      actor: req.user,
      action: "event.updated",
      summary: `Updated ${Object.keys(payload).join(", ")} on "${event.title}"`,
      targetType: "event",
      targetId: event._id,
      targetLabel: event.title,
    });

    return res.json({ ...event, photographers: (event.photographers || []).map(photographerDTO) });
  } catch (err) {
    return next(err);
  }
};

/** Every event, including drafts and private ones, with counts for the table. */
export const listAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find({})
      .sort({ startDateTime: 1 })
      .populate("photographers", "fullName email avatarUrl")
      .lean();

    const ids = events.map((e) => e._id);
    const [mediaCounts, regCounts] = await Promise.all([
      Media.aggregate([{ $match: { eventId: { $in: ids } } }, { $group: { _id: "$eventId", n: { $sum: 1 } } }]),
      EventRegistration.aggregate([
        { $match: { eventId: { $in: ids } } },
        {
          $group: {
            _id: "$eventId",
            total: { $sum: 1 },
            attended: { $sum: { $cond: ["$attended", 1, 0] } },
            // Registrations made before approval existed have no
            // approvalStatus; they are counted as pending, which is what an
            // undecided registration is.
            approved: { $sum: { $cond: [{ $eq: ["$approvalStatus", "approved"] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ["$approvalStatus", "rejected"] }, 1, 0] } },
            pendingApproval: {
              $sum: { $cond: [{ $in: ["$approvalStatus", ["pending", null]] }, 1, 0] },
            },
            paid: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] } },
            pendingPayment: { $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] } },
            revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$amountDue", 0] } },
          },
        },
      ]),
    ]);

    const mediaBy = new Map(mediaCounts.map((m) => [String(m._id), m.n]));
    const regBy = new Map(regCounts.map((r) => [String(r._id), r]));

    return res.json({
      events: events.map((e) => {
        const reg = regBy.get(String(e._id));
        return {
          ...e,
          photographers: (e.photographers || []).map(photographerDTO),
          mediaCount: mediaBy.get(String(e._id)) || 0,
          registrationCount: reg?.total || 0,
          attendedCount: reg?.attended || 0,
          approvedCount: reg?.approved || 0,
          rejectedCount: reg?.rejected || 0,
          pendingApprovalCount: reg?.pendingApproval || 0,
          paidCount: reg?.paid || 0,
          pendingPaymentCount: reg?.pendingPayment || 0,
          revenue: reg?.revenue || 0,
        };
      }),
    });
  } catch (err) {
    return next(err);
  }
};

/** Replaces the assignment list outright; the UI sends the full set. */
export const setEventPhotographers = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { photographerIds } = req.body || {};
    if (!Array.isArray(photographerIds)) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "photographerIds must be an array"));
    }
    if (photographerIds.some((id) => !mongoose.isValidObjectId(id))) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "photographerIds contains an invalid id"));
    }

    // Refuse silently-wrong assignments rather than storing ids that cannot work.
    const found = await User.find({ _id: { $in: photographerIds }, role: "photographer" }).select("_id").lean();
    if (found.length !== photographerIds.length) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "Every id must belong to a photographer account"));
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      { photographers: photographerIds },
      { new: true }
    )
      .populate("photographers", "fullName email avatarUrl")
      .lean();

    if (!event) return res.status(404).json(formatError("NOT_FOUND", "Event not found"));

    const names = (event.photographers || []).map((p) => p.fullName).join(", ") || "no one";
    await logActivity({
      actor: req.user,
      action: "event.photographers_assigned",
      summary: `Set photographers on "${event.title}" to: ${names}`,
      targetType: "event",
      targetId: event._id,
      targetLabel: event.title,
    });

    return res.json({ ...event, photographers: (event.photographers || []).map(photographerDTO) });
  } catch (err) {
    return next(err);
  }
};

/**
 * Removes an event from every surface of the app without destroying anything:
 * media files, media rows and registrations all stay, and `deletedAt` hides the
 * event through the find hook on the model. It sits in the trash until an admin
 * restores it or the retention window closes.
 */
export const deleteEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId).setOptions({ includeDeleted: true });
    if (!event) return res.status(404).json(formatError("NOT_FOUND", "Event not found"));
    if (event.deletedAt) {
      return res.status(409).json(formatError("ALREADY_TRASHED", "This event is already in the trash"));
    }

    event.deletedAt = new Date();
    await event.save();

    const [mediaCount, registrationCount] = await Promise.all([
      Media.countDocuments({ eventId }),
      EventRegistration.countDocuments({ eventId }),
    ]);

    await logActivity({
      actor: req.user,
      action: "event.trashed",
      summary: `Moved event "${event.title}" to the trash (${mediaCount} media, ${registrationCount} registrations kept)`,
      targetType: "event",
      targetId: eventId,
      targetLabel: event.title,
    });

    return res.json({
      success: true,
      trashed: true,
      autoDeleteAt: trashExpiryFor(event.deletedAt),
      retained: { media: mediaCount, registrations: registrationCount },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Destroys an event and everything attached to it. Shared by the permanent-delete
 * button and by the retention sweep, so both delete exactly the same way the old
 * one-shot endpoint did.
 */
const destroyEvent = async (event) => {
  const media = await Media.find({ eventId: event._id }).lean();
  for (const item of media) {
    try {
      await removeMedia(item.publicId, item.type);
    } catch (err) {
      console.warn(`Could not remove file for media ${item._id}:`, err.message);
    }
  }

  const [mediaResult, regResult] = await Promise.all([
    Media.deleteMany({ eventId: event._id }),
    EventRegistration.deleteMany({ eventId: event._id }),
  ]);
  await event.deleteOne();

  return { media: mediaResult.deletedCount, registrations: regResult.deletedCount };
};

/**
 * The trash list, plus the retention sweep. Events whose window has closed are
 * destroyed here rather than by a scheduled job: the trash is the only place
 * they can be seen, so nothing expires invisibly while an admin is away, and
 * the app needs no cron.
 */
export const listTrashedEvents = async (req, res, next) => {
  try {
    const trashed = await Event.find({ deletedAt: { $ne: null } })
      .sort({ deletedAt: -1 })
      .lean();

    const now = Date.now();
    const dated = trashed.map((event) => ({ event, autoDeleteAt: trashExpiryFor(event.deletedAt) }));
    const expired = dated.filter((d) => d.autoDeleteAt.getTime() < now);
    const remaining = dated.filter((d) => d.autoDeleteAt.getTime() >= now);

    for (const { event } of expired) {
      const doc = await Event.findById(event._id).setOptions({ includeDeleted: true });
      if (!doc) continue;
      await destroyEvent(doc);
      await logActivity({
        actor: req.user,
        action: "event.expired",
        summary: `Removed "${doc.title}" from the trash after ${TRASH_RETENTION_DAYS} days`,
        targetType: "event",
        targetId: doc._id,
        targetLabel: doc.title,
      });
    }

    const ids = remaining.map((d) => d.event._id);
    const [mediaCounts, regCounts] = await Promise.all([
      Media.aggregate([{ $match: { eventId: { $in: ids } } }, { $group: { _id: "$eventId", n: { $sum: 1 } } }]),
      EventRegistration.aggregate([{ $match: { eventId: { $in: ids } } }, { $group: { _id: "$eventId", n: { $sum: 1 } } }]),
    ]);
    const mediaBy = new Map(mediaCounts.map((m) => [String(m._id), m.n]));
    const regBy = new Map(regCounts.map((r) => [String(r._id), r]));

    return res.json({
      retentionDays: TRASH_RETENTION_DAYS,
      autoPurged: expired.length,
      events: remaining.map(({ event, autoDeleteAt }) => ({
        ...event,
        mediaCount: mediaBy.get(String(event._id)) || 0,
        registrationCount: regBy.get(String(event._id))?.n || 0,
        autoDeleteAt,
        daysLeft: Math.max(0, Math.ceil((autoDeleteAt.getTime() - now) / 86400000)),
      })),
    });
  } catch (err) {
    return next(err);
  }
};

/** Puts a trashed event back exactly as it was, media and registrations intact. */
export const restoreEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId).setOptions({ includeDeleted: true });
    if (!event) return res.status(404).json(formatError("NOT_FOUND", "Event not found"));
    if (!event.deletedAt) {
      return res.status(409).json(formatError("NOT_IN_TRASH", "This event is not in the trash"));
    }

    event.deletedAt = null;
    await event.save();

    await logActivity({
      actor: req.user,
      action: "event.restored",
      summary: `Restored event "${event.title}" from the trash`,
      targetType: "event",
      targetId: eventId,
      targetLabel: event.title,
    });

    return res.json({
      success: true,
      event: { ...event.toObject(), photographers: (event.photographers || []).map(photographerDTO) },
    });
  } catch (err) {
    return next(err);
  }
};

/** The only route that really deletes anything. No undo. */
export const purgeEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId).setOptions({ includeDeleted: true });
    if (!event) return res.status(404).json(formatError("NOT_FOUND", "Event not found"));

    const title = event.title;
    const wasTrashed = !!event.deletedAt;
    const deleted = await destroyEvent(event);

    await logActivity({
      actor: req.user,
      action: "event.purged",
      summary: `Permanently deleted event "${title}" (${deleted.media} media, ${deleted.registrations} registrations)`,
      targetType: "event",
      targetId: eventId,
      targetLabel: title,
    });

    return res.json({ success: true, wasTrashed, deleted });
  } catch (err) {
    return next(err);
  }
};

/**
 * Opens or closes the check-in window for one event. Kept separate from
 * updateEvent because it is a door, not a field edit: opening it is refused
 * outright when nobody has registered yet, since there would be nobody to
 * check in.
 */
export const setCheckInOpen = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { checkInOpen } = req.body || {};
    if (typeof checkInOpen !== "boolean") {
      return res.status(400).json(formatError("VALIDATION_ERROR", "checkInOpen must be true or false"));
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json(formatError("NOT_FOUND", "Event not found"));

    if (checkInOpen) {
      if (event.status !== "registration-open") {
        return res.status(409).json(
          formatError("EVENT_NOT_LIVE", "Check-in can only be opened for a published event that has not been completed.")
        );
      }
      const registrationCount = await EventRegistration.countDocuments({ eventId });
      if (registrationCount === 0) {
        return res.status(400).json(
          formatError("NO_REGISTRATIONS", "This event has no registrations yet, so check-in cannot be opened.")
        );
      }
    }

    event.checkInOpen = checkInOpen;
    await event.save();

    await logActivity({
      actor: req.user,
      action: checkInOpen ? "event.checkin_opened" : "event.checkin_closed",
      summary: `${checkInOpen ? "Opened" : "Closed"} check-in for "${event.title}"`,
      targetType: "event",
      targetId: event._id,
      targetLabel: event.title,
    });

    return res.json({ checkInOpen: event.checkInOpen });
  } catch (err) {
    return next(err);
  }
};

/**
 * Every registrant for one event, with who they are, the serial/QR code that
 * proves their registration, and whether (and when, and by whom) they were
 * actually checked in at the door. This is the detail an admin needs behind
 * the summary counts shown on the events list.
 */
export const listEventRegistrations = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId)
      .select("title startDateTime endDateTime status isPremium currency plans")
      .lean();
    if (!event) return res.status(404).json(formatError("NOT_FOUND", "Event not found"));

    const registrations = await EventRegistration.find({ eventId })
      // Everything the guest submitted, so the admin can review a person
      // properly before deciding rather than approving from a name alone.
      .populate(
        "userId",
        "fullName email phone location institution educationLevel fieldOfStudy sex dateOfBirth bio avatarUrl createdAt"
      )
      .populate("checkedInBy", "fullName role")
      .populate("paymentConfirmedBy", "fullName role")
      .populate("decidedBy", "fullName role")
      .sort({ registeredAt: -1 })
      .lean();

    const rows = registrations.map((r) => ({
      id: r._id,
      user: r.userId
        ? {
            id: r.userId._id,
            fullName: r.userId.fullName,
            email: r.userId.email,
            phone: r.userId.phone || "",
            location: r.userId.location || "",
            institution: r.userId.institution || "",
            educationLevel: r.userId.educationLevel || "",
            fieldOfStudy: r.userId.fieldOfStudy || "",
            sex: r.userId.sex || "",
            dateOfBirth: r.userId.dateOfBirth || null,
            bio: r.userId.bio || "",
            avatarUrl: r.userId.avatarUrl || "",
            memberSince: r.userId.createdAt || null,
          }
        : null,
      approvalStatus: r.approvalStatus || "pending",
      decidedAt: r.decidedAt || null,
      decidedBy: r.decidedBy ? { fullName: r.decidedBy.fullName, role: r.decidedBy.role } : null,
      decisionNote: r.decisionNote || "",
      registrationCode: r.registrationCode || "",
      registeredAt: r.registeredAt,
      attended: r.attended,
      checkedInAt: r.checkedInAt || null,
      checkedInBy: r.checkedInBy ? { fullName: r.checkedInBy.fullName, role: r.checkedInBy.role } : null,
      planId: r.planId || null,
      planName: r.planName || "",
      amountDue: r.amountDue ?? null,
      currency: r.currency || "",
      paymentStatus: r.paymentStatus,
      paymentMethod: r.paymentMethod || "",
      paymentReference: r.paymentReference || "",
      paymentConfirmedAt: r.paymentConfirmedAt || null,
      paymentConfirmedBy: r.paymentConfirmedBy ? { fullName: r.paymentConfirmedBy.fullName, role: r.paymentConfirmedBy.role } : null,
    }));

    const attended = rows.filter((r) => r.attended).length;
    const pending = rows.filter((r) => r.approvalStatus === "pending").length;
    const approved = rows.filter((r) => r.approvalStatus === "approved").length;
    const rejected = rows.filter((r) => r.approvalStatus === "rejected").length;
    const paid = rows.filter((r) => r.paymentStatus === "paid").length;
    const pendingPayment = rows.filter((r) => r.paymentStatus === "pending").length;
    const revenue = rows.filter((r) => r.paymentStatus === "paid").reduce((sum, r) => sum + (r.amountDue || 0), 0);

    return res.json({
      event: {
        id: event._id,
        title: event.title,
        startDateTime: event.startDateTime,
        endDateTime: event.endDateTime,
        status: event.status,
        isPremium: event.isPremium,
        currency: event.currency,
        plans: event.plans || [],
      },
      counts: {
        total: rows.length,
        attended,
        notAttended: rows.length - attended,
        pending, approved, rejected,
        paid, pendingPayment, revenue,
      },
      registrations: rows,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * The admin's decision on who actually attends. The rules live in
 * registrationService so the organizer console behaves identically.
 */
export const setRegistrationApproval = async (req, res, next) => {
  try {
    const { eventId, registrationId } = req.params;
    const { approvalStatus, note = "" } = req.body || {};

    const registration = await EventRegistration.findOne({ _id: registrationId, eventId });
    if (!registration) return res.status(404).json(formatError("NOT_FOUND", "Registration not found"));
    const event = await Event.findById(eventId).lean();
    if (!event) return res.status(404).json(formatError("NOT_FOUND", "Event not found"));

    const result = await decideRegistration({ event, registration, approvalStatus, note, actor: req.user });
    if (result.error) return res.status(result.status).json(result.error);

    return res.json({
      registration: {
        id: registration._id,
        approvalStatus: registration.approvalStatus,
        decidedAt: registration.decidedAt,
        decisionNote: registration.decisionNote,
        registrationCode: registration.registrationCode || "",
        attended: registration.attended,
      },
      emailDelivered: result.emailDelivered,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * Manually confirms (or reverses) payment for one premium-event registration.
 * An admin reviews proof of payment collected outside the app and flips this.
 */
export const setRegistrationPayment = async (req, res, next) => {
  try {
    const { eventId, registrationId } = req.params;
    const { paymentStatus, paymentReference } = req.body || {};

    const registration = await EventRegistration.findOne({ _id: registrationId, eventId });
    if (!registration) return res.status(404).json(formatError("NOT_FOUND", "Registration not found"));
    const event = await Event.findById(eventId).select("title isPremium").lean();
    if (!event) return res.status(404).json(formatError("NOT_FOUND", "Event not found"));

    const result = await applyPayment({ event, registration, paymentStatus, paymentReference, actor: req.user });
    if (result.error) return res.status(result.status).json(result.error);
    return res.json({ registration });
  } catch (err) {
    return next(err);
  }
};

/** Photographer accounts an admin can pick from when assigning. */
export const listPhotographers = async (req, res, next) => {
  try {
    const users = await User.find({ role: "photographer" })
      .select("fullName email avatarUrl")
      .sort({ fullName: 1 })
      .lean();
    return res.json({
      photographers: users.map((u) => ({
        id: u._id,
        fullName: u.fullName,
        email: u.email,
        avatarUrl: u.avatarUrl || "",
      })),
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  createEvent,
  updateEvent,
  listAllEvents,
  setEventPhotographers,
  setCheckInOpen,
  deleteEvent,
  listPhotographers,
  listEventRegistrations,
  setRegistrationPayment,
};
