import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import requireRole from "../middleware/role.js";
import { checkInLimiter } from "../middleware/rateLimit.js";
import {
  getOrganizerDashboard,
  listOrganizerEvents,
  createOrganizerEvent,
  updateOrganizerEvent,
  setOrganizerCheckInOpen,
  trashOrganizerEvent,
  listOrganizerRegistrations,
  setOrganizerRegistrationApproval,
  setOrganizerRegistrationPayment,
  organizerCheckIn,
  listOrganizerPhotographers,
  assignPhotographersToEvent,
} from "../controllers/organizer.controller.js";

const router = Router();

// Only organizers and admins can access this route group
router.use(requireAuth, requireRole("organizer", "admin"));

router.get("/dashboard", getOrganizerDashboard);
router.get("/events", listOrganizerEvents);
router.post("/events", createOrganizerEvent);
router.patch("/events/:eventId", updateOrganizerEvent);
router.delete("/events/:eventId", trashOrganizerEvent);
router.post("/events/:eventId/check-in/open", (req, res, next) => {
  req.body.checkInOpen = true;
  return setOrganizerCheckInOpen(req, res, next);
});
router.post("/events/:eventId/check-in/close", (req, res, next) => {
  req.body.checkInOpen = false;
  return setOrganizerCheckInOpen(req, res, next);
});
router.patch("/events/:eventId/check-in", setOrganizerCheckInOpen);

router.get("/events/:eventId/registrations", listOrganizerRegistrations);
router.post("/events/:eventId/registrations/:registrationId/approval", setOrganizerRegistrationApproval);
router.post("/events/:eventId/registrations/:registrationId/payment", setOrganizerRegistrationPayment);

router.post("/check-in", checkInLimiter, organizerCheckIn);

router.get("/photographers", listOrganizerPhotographers);
router.post("/events/:eventId/photographers", assignPhotographersToEvent);

export default router;
