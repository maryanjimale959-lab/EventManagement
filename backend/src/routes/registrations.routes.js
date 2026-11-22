import { Router } from "express";
import {
  cancelMyRegistration,
  checkIn,
  galleryGate,
  getMyRegistration,
  registerForEvent,
  updateMyPaymentReference,
} from "../controllers/registrations.controller.js";
import { requireAuth } from "../middleware/auth.js";
import requireRole from "../middleware/role.js";
import { checkInLimiter } from "../middleware/rateLimit.js";

const router = Router();

// Registration
router.post("/:eventId/register", requireAuth, registerForEvent);
router.get("/:eventId/registration/me", requireAuth, getMyRegistration);
router.patch("/:eventId/registration/me/payment-reference", requireAuth, updateMyPaymentReference);
router.delete("/:eventId/registration/me", requireAuth, cancelMyRegistration);

// Check-in (admin, organizer, or photographer)
router.post(
  "/:eventId/checkin",
  checkInLimiter,
  requireAuth,
  requireRole("admin", "organizer", "photographer"),
  checkIn
);

// Gallery gate
router.get("/:eventId/gallery", requireAuth, galleryGate);

export default router;

