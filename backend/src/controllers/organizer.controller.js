import crypto from "crypto";
import mongoose from "mongoose";
import Event, { EVENT_STATUSES, TRASH_RETENTION_DAYS, trashExpiryFor, parseCapacity } from "../models/Event.js";
import User, { toUserDTO } from "../models/User.js";
import Media from "../models/Media.js";
import EventRegistration from "../models/EventRegistration.js";
import { isStorageReady, removeMedia, storeMedia } from "../config/storage.js";
import { logActivity } from "../utils/activityLog.js";
import { decideRegistration, applyPayment, performCheckIn, seatsTaken } from "../services/registrationService.js";

const formatError = (code, message) => ({ error: { code, message } });

const ensureOrganizerOwnsEvent = async (eventId, userId, role) => {
  const event = await Event.findById(eventId);
  if (!event) return { error: formatError("NOT_FOUND", "Event not found"), event: null };
  if (role !== "admin" && String(event.createdBy) !== String(userId)) {
    return { error: formatError("FORBIDDEN", "You do not have permission to manage this event"), event: null };
  }
  return { error: null, event };
};

export const getOrganizerDashboard = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const isSuperAdmin = req.user.role === "admin";
    const eventFilter = isSuperAdmin ? {} : { createdBy: userId };

    const events = await Event.find(eventFilter).sort({ startDateTime: 1 }).lean();
    const eventIds = events.map((e) => e._id);

    const registrations = eventIds.length
      ? await EventRegistration.find({ eventId: { $in: eventIds } })
          .populate("userId", "fullName email")
          .populate("eventId", "title")
          .sort({ registeredAt: -1 })
          .lean()
      : [];

    const totalEvents = events.length;
    const activeEvents = events.filter((e) => e.status === "registration-open").length;
    const totalRegistrations = registrations.length;
    const totalCheckedIn = registrations.filter((r) => r.attended).length;
    const totalRevenue = registrations
      .filter((r) => r.paymentStatus === "paid")
      .reduce((sum, r) => sum + (r.amountDue || 0), 0);

    const recentRegistrations = registrations.slice(0, 8).map((r) => ({
      id: r._id,
      eventId: r.eventId?._id,
      eventTitle: r.eventId?.title || "Somali Event",
      guestName: r.userId?.fullName || "Guest",
      guestEmail: r.userId?.email || "",
      planName: r.planName || "Standard",
      amountDue: r.amountDue,
      currency: r.currency || "USD",
      paymentStatus: r.paymentStatus,
      approvalStatus: r.approvalStatus,
      attended: r.attended,
      registeredAt: r.registeredAt,
    }));

    return res.json({
      stats: {
        totalEvents,
        activeEvents,
        totalRegistrations,
        totalCheckedIn,
        totalRevenue,
      },
      upcomingEvents: events.filter((e) => new Date(e.startDateTime) >= new Date()).slice(0, 4),
      recentRegistrations,
    });
  } catch (err) {
    return next(err);
  }
};

export const listOrganizerEvents = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const isSuperAdmin = req.user.role === "admin";
    const filter = isSuperAdmin ? {} : { createdBy: userId };

    const events = await Event.find(filter)
      .populate("photographers", "fullName email")
      .sort({ createdAt: -1 })
      .lean();

    const eventIds = events.map((e) => e._id);
    const regs = eventIds.length
      ? await EventRegistration.aggregate([
          { $match: { eventId: { $in: eventIds } } },
          {
            $group: {
              _id: "$eventId",
              total: { $sum: 1 },
              attended: { $sum: { $cond: ["$attended", 1, 0] } },
              pending: { $sum: { $cond: [{ $eq: ["$approvalStatus", "pending"] }, 1, 0] } },
              paid: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, 1, 0] } },
              revenue: {
                $sum: {
                  $cond: [{ $eq: ["$paymentStatus", "paid"] }, { $ifNull: ["$amountDue", 0] }, 0],
                },
              },
            },
          },
        ])
      : [];
    const regByEvent = new Map(regs.map((r) => [String(r._id), r]));

    const mediaCounts = eventIds.length
      ? await Media.aggregate([
          { $match: { eventId: { $in: eventIds } } },
          { $group: { _id: "$eventId", count: { $sum: 1 } } },
        ])
      : [];
    const mediaByEvent = new Map(mediaCounts.map((m) => [String(m._id), m.count]));

    const enriched = events.map((e) => {
      const r = regByEvent.get(String(e._id)) || { total: 0, attended: 0, pending: 0, paid: 0, revenue: 0 };
      return {
        ...e,
        registrationCount: r.total,
        attendedCount: r.attended,
        pendingApprovalCount: r.pending,
        paidCount: r.paid,
        revenue: r.revenue,
        mediaCount: mediaByEvent.get(String(e._id)) || 0,
      };
    });

    return res.json({ events: enriched });
  } catch (err) {
    return next(err);
  }
};

export const createOrganizerEvent = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const body = req.body || {};
    const { title, description = "", location = "", category = "Technology", startDateTime, endDateTime, visibility = "public", status = "draft", isPremium = false, currency = "USD", plans = [], coverImageUrl = "" } = body;

    if (!title || !startDateTime || !endDateTime) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "title, startDateTime, and endDateTime are required"));
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "Invalid date format"));
    }
    if (end <= start) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "endDateTime must be after startDateTime"));
    }
    if (!EVENT_STATUSES.includes(status)) {
      return res.status(400).json(formatError("VALIDATION_ERROR", `status must be one of: ${EVENT_STATUSES.join(", ")}`));
    }
    if (!["public", "private"].includes(visibility)) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "visibility must be public or private"));
    }
    const cap = parseCapacity(body.capacity);
    if (cap.error) return res.status(400).json(formatError("VALIDATION_ERROR", cap.error));

    let cleanPlans = [];
    if (isPremium) {
      if (!Array.isArray(plans) || plans.length === 0) {
        return res.status(400).json(formatError("VALIDATION_ERROR", "Premium events require at least one plan"));
      }
      for (const p of plans) {
        const name = (p?.name || "").trim();
        const price = Number(p?.price);
        if (!name || isNaN(price) || price < 0) {
          return res.status(400).json(formatError("VALIDATION_ERROR", "Every plan must have a name and non-negative price"));
        }
        cleanPlans.push({ name, price, description: (p?.description || "").trim() });
      }
    }

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      category: category.trim(),
      startDateTime: start,
      endDateTime: end,
      visibility,
      status,
      published: status !== "draft",
      isPremium: Boolean(isPremium),
      currency: currency.trim() || "USD",
      plans: cleanPlans,
      capacity: cap.value ?? null,
      coverImageUrl: coverImageUrl.trim(),
      createdBy: userId,
      photographers: [],
    });

    await logActivity({
      actor: req.user,
      action: "event.created",
      summary: `Organizer created event "${event.title}"`,
      targetType: "event",
      targetId: event._id,
      targetLabel: event.title,
    });

    return res.status(201).json({ event });
  } catch (err) {
    return next(err);
  }
};

export const updateOrganizerEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { error, event } = await ensureOrganizerOwnsEvent(eventId, req.user.userId, req.user.role);
    if (error) return res.status(error.error?.code === "NOT_FOUND" ? 404 : 403).json(error);

    const body = req.body || {};
    const updatable = ["title", "description", "location", "category", "startDateTime", "endDateTime", "visibility", "status", "coverImageUrl", "currency"];

    if (body.status !== undefined && !EVENT_STATUSES.includes(body.status)) {
      return res.status(400).json(formatError("VALIDATION_ERROR", `status must be one of: ${EVENT_STATUSES.join(", ")}`));
    }
    if (body.visibility !== undefined && !["public", "private"].includes(body.visibility)) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "visibility must be public or private"));
    }

    for (const key of updatable) {
      if (body[key] !== undefined) {
        if (key === "startDateTime" || key === "endDateTime") {
          const d = new Date(body[key]);
          if (isNaN(d.getTime())) return res.status(400).json(formatError("VALIDATION_ERROR", `Invalid ${key}`));
          event[key] = d;
        } else {
          event[key] = body[key];
        }
      }
    }

    // Plans get the same cleaning as on create. Guests who already chose a plan
    // keep the snapshot taken at registration, so editing here is safe.
    // Plans only apply to paid events. The console sends an empty list for a
    // free one, which is simply ignored rather than treated as an error.
    if (body.plans !== undefined && event.isPremium) {
      if (!Array.isArray(body.plans) || body.plans.length === 0) {
        return res.status(400).json(formatError("VALIDATION_ERROR", "A premium event needs at least one plan"));
      }
      const cleaned = [];
      for (const p of body.plans) {
        const name = (p?.name || "").trim();
        const price = Number(p?.price);
        if (!name || !Number.isFinite(price) || price < 0) {
          return res.status(400).json(formatError("VALIDATION_ERROR", "Every plan must have a name and non-negative price"));
        }
        cleaned.push({ name, price, description: (p?.description || "").trim() });
      }
      event.plans = cleaned;
    }

    if (body.capacity !== undefined) {
      const cap = parseCapacity(body.capacity);
      if (cap.error) return res.status(400).json(formatError("VALIDATION_ERROR", cap.error));
      if (cap.value) {
        const taken = await seatsTaken(eventId);
        if (cap.value < taken) {
          return res.status(409).json(formatError("CAPACITY_TOO_LOW", `${taken} places are already taken, so capacity cannot be set below that.`));
        }
      }
      event.capacity = cap.value;
    }

    if (event.endDateTime <= event.startDateTime) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "endDateTime must be after startDateTime"));
    }

    if (body.status !== undefined) {
      event.published = body.status !== "draft";
      // A finished event has no door to keep open.
      if (body.status === "completed") event.checkInOpen = false;
    }

    await event.save();

    await logActivity({
      actor: req.user,
      action: "event.updated",
      summary: `Organizer updated event "${event.title}"`,
      targetType: "event",
      targetId: event._id,
      targetLabel: event.title,
    });

    return res.json({ event });
  } catch (err) {
    return next(err);
  }
};

export const setOrganizerCheckInOpen = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { checkInOpen } = req.body || {};
    if (typeof checkInOpen !== "boolean") {
      return res.status(400).json(formatError("VALIDATION_ERROR", "checkInOpen must be true or false"));
    }

    const { error, event } = await ensureOrganizerOwnsEvent(eventId, req.user.userId, req.user.role);
    if (error) return res.status(error.error?.code === "NOT_FOUND" ? 404 : 403).json(error);

    if (checkInOpen) {
      if (event.status !== "registration-open") {
        return res.status(409).json(formatError("EVENT_NOT_LIVE", "Check-in can only be opened for a published event that has not been completed."));
      }
      const regCount = await EventRegistration.countDocuments({ eventId });
      if (regCount === 0) {
        return res.status(400).json(formatError("NO_REGISTRATIONS", "Cannot open check-in before any guests have registered."));
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

export const trashOrganizerEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { error, event } = await ensureOrganizerOwnsEvent(eventId, req.user.userId, req.user.role);
    if (error) return res.status(error.error?.code === "NOT_FOUND" ? 404 : 403).json(error);

    event.deletedAt = new Date();
    await event.save();

    return res.json({ success: true, eventId: event._id });
  } catch (err) {
    return next(err);
  }
};

export const listOrganizerRegistrations = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { error, event } = await ensureOrganizerOwnsEvent(eventId, req.user.userId, req.user.role);
    if (error) return res.status(error.error?.code === "NOT_FOUND" ? 404 : 403).json(error);

    const registrations = await EventRegistration.find({ eventId })
      .populate("userId", "fullName email phone location institution educationLevel fieldOfStudy bio avatarUrl createdAt")
      .populate("decidedBy", "fullName role")
      .populate("paymentConfirmedBy", "fullName role")
      .populate("checkedInBy", "fullName role")
      .sort({ registeredAt: -1 })
      .lean();

    // Never expose qrToken in the guest list — the token is the guest's private door secret.
    const formatted = registrations.map((r) => ({
      id: r._id,
      eventId: r.eventId,
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
            bio: r.userId.bio || "",
            avatarUrl: r.userId.avatarUrl || "",
            memberSince: r.userId.createdAt || null,
          }
        : null,
      registeredAt: r.registeredAt,
      approvalStatus: r.approvalStatus || "pending",
      decidedAt: r.decidedAt || null,
      decidedBy: r.decidedBy ? { fullName: r.decidedBy.fullName, role: r.decidedBy.role } : null,
      decisionNote: r.decisionNote || "",
      registrationCode: r.registrationCode || "",
      attended: r.attended,
      checkedInAt: r.checkedInAt || null,
      checkedInBy: r.checkedInBy ? { fullName: r.checkedInBy.fullName, role: r.checkedInBy.role } : null,
      planName: r.planName || "",
      amountDue: r.amountDue ?? null,
      currency: r.currency || "USD",
      paymentStatus: r.paymentStatus,
      paymentReference: r.paymentReference || "",
      paymentConfirmedAt: r.paymentConfirmedAt || null,
      paymentConfirmedBy: r.paymentConfirmedBy ? { fullName: r.paymentConfirmedBy.fullName, role: r.paymentConfirmedBy.role } : null,
    }));

    return res.json({
      event: {
        id: event._id,
        title: event.title,
        status: event.status,
        capacity: event.capacity ?? null,
        checkInOpen: event.checkInOpen,
        isPremium: event.isPremium,
        currency: event.currency,
        plans: event.plans || [],
      },
      registrations: formatted,
      counts: {
        total: formatted.length,
        attended: formatted.filter((r) => r.attended).length,
        approved: formatted.filter((r) => r.approvalStatus === "approved").length,
        rejected: formatted.filter((r) => r.approvalStatus === "rejected").length,
        pending: formatted.filter((r) => r.approvalStatus === "pending").length,
        paid: formatted.filter((r) => r.paymentStatus === "paid").length,
        unpaid: formatted.filter((r) => r.amountDue > 0 && r.paymentStatus === "pending").length,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const setOrganizerRegistrationApproval = async (req, res, next) => {
  try {
    const { eventId, registrationId } = req.params;
    const { approvalStatus, note = "" } = req.body || {};

    const { error, event } = await ensureOrganizerOwnsEvent(eventId, req.user.userId, req.user.role);
    if (error) return res.status(error.error?.code === "NOT_FOUND" ? 404 : 403).json(error);

    const registration = await EventRegistration.findOne({ _id: registrationId, eventId });
    if (!registration) return res.status(404).json(formatError("NOT_FOUND", "Registration not found"));

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

export const setOrganizerRegistrationPayment = async (req, res, next) => {
  try {
    const { eventId, registrationId } = req.params;
    const { paymentStatus, paymentReference } = req.body || {};

    const { error, event } = await ensureOrganizerOwnsEvent(eventId, req.user.userId, req.user.role);
    if (error) return res.status(error.error?.code === "NOT_FOUND" ? 404 : 403).json(error);

    const registration = await EventRegistration.findOne({ _id: registrationId, eventId });
    if (!registration) return res.status(404).json(formatError("NOT_FOUND", "Registration not found"));

    const result = await applyPayment({ event, registration, paymentStatus, paymentReference, actor: req.user });
    if (result.error) return res.status(result.status).json(result.error);
    return res.json({ registration });
  } catch (err) {
    return next(err);
  }
};

export const organizerCheckIn = async (req, res, next) => {
  try {
    const { eventId, registrationCode, qrToken } = req.body || {};
    if (!eventId) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "eventId is required"));
    }
    if (!registrationCode && !qrToken) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "registrationCode or qrToken is required"));
    }

    const { error, event } = await ensureOrganizerOwnsEvent(eventId, req.user.userId, req.user.role);
    if (error) return res.status(error.error?.code === "NOT_FOUND" ? 404 : 403).json(error);

    const result = await performCheckIn({ event, registrationCode, qrToken, actor: req.user });
    return res.status(result.status).json(result.body);
  } catch (err) {
    return next(err);
  }
};

export const listOrganizerPhotographers = async (req, res, next) => {
  try {
    const photographers = await User.find({ role: "photographer", isActive: { $ne: false } })
      .select("fullName email avatarUrl phone")
      .lean();
    return res.json({ photographers: photographers.map((p) => toUserDTO(p)) });
  } catch (err) {
    return next(err);
  }
};

export const assignPhotographersToEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { photographerIds } = req.body || {};
    if (!Array.isArray(photographerIds)) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "photographerIds must be an array"));
    }

    const { error, event } = await ensureOrganizerOwnsEvent(eventId, req.user.userId, req.user.role);
    if (error) return res.status(error.error?.code === "NOT_FOUND" ? 404 : 403).json(error);

    event.photographers = photographerIds;
    await event.save();

    return res.json({ photographers: event.photographers });
  } catch (err) {
    return next(err);
  }
};
