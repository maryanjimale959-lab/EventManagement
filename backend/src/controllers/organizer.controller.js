import crypto from "crypto";
import mongoose from "mongoose";
import Event, { EVENT_STATUSES, TRASH_RETENTION_DAYS, trashExpiryFor } from "../models/Event.js";
import User, { toUserDTO } from "../models/User.js";
import Media from "../models/Media.js";
import EventRegistration from "../models/EventRegistration.js";
import { isStorageReady, removeMedia, storeMedia } from "../config/storage.js";
import { logActivity } from "../utils/activityLog.js";
import {
  sendRegistrationApprovedEmail,
  sendRegistrationRejectedEmail,
} from "../config/mailer.js";

const formatError = (code, message) => ({ error: { code, message } });

const appBaseUrl = () =>
  (process.env.APP_BASE_URL || process.env.CORS_ORIGIN || "http://localhost:5173").replace(/\/+$/, "");

const generateRegistrationCode = () => `EVT-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
const generateQrToken = () => crypto.randomBytes(32).toString("hex");

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
    if (end < start) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "endDateTime must be on or after startDateTime"));
    }

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
    const updatable = ["title", "description", "location", "category", "startDateTime", "endDateTime", "visibility", "status", "coverImageUrl", "currency", "plans"];

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

    if (event.endDateTime < event.startDateTime) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "endDateTime cannot be before startDateTime"));
    }

    if (body.status !== undefined) {
      event.published = body.status !== "draft";
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
      .populate("userId", "fullName email phone location institution")
      .sort({ registeredAt: -1 })
      .lean();

    const formatted = registrations.map((r) => ({
      id: r._id,
      eventId: r.eventId,
      user: r.userId ? {
        id: r.userId._id,
        fullName: r.userId.fullName,
        email: r.userId.email,
        phone: r.userId.phone,
        location: r.userId.location,
        institution: r.userId.institution,
      } : null,
      registeredAt: r.registeredAt,
      approvalStatus: r.approvalStatus || "pending",
      registrationCode: r.registrationCode || "",
      qrToken: r.qrToken || "",
      attended: r.attended,
      checkedInAt: r.checkedInAt || null,
      planName: r.planName || "",
      amountDue: r.amountDue,
      currency: r.currency || "USD",
      paymentStatus: r.paymentStatus,
      paymentReference: r.paymentReference || "",
    }));

    return res.json({
      event: {
        id: event._id,
        title: event.title,
        status: event.status,
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
        pending: formatted.filter((r) => r.approvalStatus === "pending").length,
        paid: formatted.filter((r) => r.paymentStatus === "paid").length,
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

    if (!["pending", "approved", "rejected"].includes(approvalStatus)) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "approvalStatus must be pending, approved, or rejected"));
    }

    const { error, event } = await ensureOrganizerOwnsEvent(eventId, req.user.userId, req.user.role);
    if (error) return res.status(error.error?.code === "NOT_FOUND" ? 404 : 403).json(error);

    const registration = await EventRegistration.findOne({ _id: registrationId, eventId });
    if (!registration) return res.status(404).json(formatError("NOT_FOUND", "Registration not found"));

    if (registration.attended && approvalStatus !== "approved") {
      return res.status(409).json(formatError("ALREADY_CHECKED_IN", "This guest has already checked in; approval cannot be revoked."));
    }

    const guest = await User.findById(registration.userId).select("fullName email").lean();

    registration.approvalStatus = approvalStatus;
    registration.decidedAt = new Date();
    registration.decisionNote = note.trim();

    if (approvalStatus === "approved") {
      if (!registration.registrationCode) registration.registrationCode = generateRegistrationCode();
      if (!registration.qrToken) registration.qrToken = generateQrToken();
    } else {
      registration.registrationCode = undefined;
      registration.qrToken = undefined;
    }

    await registration.save();

    if (guest?.email && approvalStatus === "approved") {
      try {
        const qrUrl = `${appBaseUrl()}/events/${eventId}/registration`;
        await sendRegistrationApprovedEmail({
          to: guest.email,
          fullName: guest.fullName,
          eventTitle: event.title,
          eventDate: event.startDateTime,
          eventLocation: event.location,
          registrationCode: registration.registrationCode,
          qrToken: registration.qrToken,
          qrUrl,
        });
      } catch (e) {
        console.warn("Mail send skipped:", e.message);
      }
    }

    return res.json({
      registration: {
        id: registration._id,
        approvalStatus: registration.approvalStatus,
        registrationCode: registration.registrationCode || "",
        attended: registration.attended,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const setOrganizerRegistrationPayment = async (req, res, next) => {
  try {
    const { eventId, registrationId } = req.params;
    const { paymentStatus, paymentReference } = req.body || {};
    if (!["pending", "paid", "refunded"].includes(paymentStatus)) {
      return res.status(400).json(formatError("VALIDATION_ERROR", "paymentStatus must be pending, paid, or refunded"));
    }

    const { error, event } = await ensureOrganizerOwnsEvent(eventId, req.user.userId, req.user.role);
    if (error) return res.status(error.error?.code === "NOT_FOUND" ? 404 : 403).json(error);

    const registration = await EventRegistration.findOne({ _id: registrationId, eventId });
    if (!registration) return res.status(404).json(formatError("NOT_FOUND", "Registration not found"));

    registration.paymentStatus = paymentStatus;
    if (paymentReference !== undefined) registration.paymentReference = paymentReference;
    if (paymentStatus === "paid") {
      registration.paymentConfirmedAt = new Date();
      registration.paymentConfirmedBy = req.user.userId;
    } else {
      registration.paymentConfirmedAt = undefined;
      registration.paymentConfirmedBy = undefined;
    }
    await registration.save();

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

    if (!event.checkInOpen) {
      return res.status(403).json(formatError("CHECKIN_CLOSED", "Check-in door is not open for this event yet."));
    }

    const query = { eventId };
    if (registrationCode) query.registrationCode = String(registrationCode).trim();
    if (qrToken) query.qrToken = String(qrToken).trim();

    const registration = await EventRegistration.findOne(query);
    if (!registration) {
      return res.status(404).json(formatError("INVALID_CODE", "Invalid ticket code or QR token for this event."));
    }

    if (registration.approvalStatus !== "approved") {
      return res.status(403).json(formatError("NOT_APPROVED", "This guest registration has not been approved."));
    }

    if (event.isPremium && registration.paymentStatus !== "paid") {
      return res.status(403).json(formatError("PAYMENT_REQUIRED", "Ticket fee is unpaid. Confirm payment before checking in."));
    }

    const guest = await User.findById(registration.userId).select("fullName email phone").lean();
    const guestDTO = guest ? { fullName: guest.fullName, email: guest.email, phone: guest.phone } : null;

    if (registration.attended) {
      return res.status(409).json({
        error: { code: "ALREADY_CHECKED_IN", message: `${guest?.fullName || "Guest"} was already checked in.` },
        registration,
        guest: guestDTO,
      });
    }

    registration.attended = true;
    registration.checkedInAt = new Date();
    registration.checkedInBy = req.user.userId;
    await registration.save();

    await logActivity({
      actor: req.user,
      action: "registration.checked_in",
      summary: `Organizer checked in ${guest?.fullName || "guest"} for "${event.title}"`,
      targetType: "registration",
      targetId: registration._id,
      targetLabel: guest?.fullName || "",
    });

    return res.json({ registration, guest: guestDTO });
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
