import jwt from "jsonwebtoken";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";

const formatError = (code, message) => ({ error: { code, message } });

const STAFF_ROLES = ["admin", "organizer", "photographer"];

/** The route is public, so identity is read if offered but never required. */
const optionalUser = (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    return { userId: decoded.sub, role: decoded.role };
  } catch {
    return null;
  }
};

/** Adds how many places remain, so the page can say "12 left" or "Full" before anyone tries. */
const withAvailability = async (events) => {
  const limited = events.filter((e) => e.capacity);
  if (limited.length === 0) return events.map((e) => ({ ...e, seatsLeft: null }));

  const taken = await EventRegistration.aggregate([
    { $match: { eventId: { $in: limited.map((e) => e._id) }, approvalStatus: { $ne: "rejected" } } },
    { $group: { _id: "$eventId", n: { $sum: 1 } } },
  ]);
  const takenBy = new Map(taken.map((t) => [String(t._id), t.n]));
  return events.map((e) => ({
    ...e,
    seatsLeft: e.capacity ? Math.max(0, e.capacity - (takenBy.get(String(e._id)) || 0)) : null,
  }));
};

export const listPublic = async (req, res, next) => {
  try {
    // Drafts stay hidden; open and completed public events are both listed so
    // past events remain browsable.
    const events = await Event.find({
      published: true,
      visibility: "public",
      status: { $ne: "draft" },
    })
      .sort({ startDateTime: 1 })
      .lean();
    return res.json(await withAvailability(events));
  } catch (err) {
    return next(err);
  }
};

export const getEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId).lean();
    if (!event) {
      return res.status(404).json(formatError("NOT_FOUND", "Event not found"));
    }

    // A draft is work in progress. Anyone guessing its id used to be able to read
    // it; now only staff (who edit and manage it) can. Private-but-published
    // events stay reachable by direct link, which is what private means here.
    if (!event.published) {
      const user = optionalUser(req);
      if (!user || !STAFF_ROLES.includes(user.role)) {
        return res.status(404).json(formatError("NOT_FOUND", "Event not found"));
      }
    }

    const [withSeats] = await withAvailability([event]);
    return res.json(withSeats);
  } catch (err) {
    return next(err);
  }
};

export default {
  listPublic,
  getEvent,
};
