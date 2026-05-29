import { Router } from "express";
import verifyUserToken from "../middleware/jwt/user.middleware.js";
import verifyOwnerToken from "../middleware/jwt/owner.middleware.js";
import verifyAdminToken from "../middleware/jwt/admin.middleware.js";
import { ProfessionalController } from "../controllers/professional.controller.js";

const router = Router();

// User routes
router.post("/match-request", verifyUserToken, ProfessionalController.requestMatch);
router.post("/disputes", verifyUserToken, ProfessionalController.raiseDispute);

// Professional (Owner) routes
router.post("/offers/:notificationId/respond", verifyOwnerToken, ProfessionalController.respondToOffer);
router.post("/bookings/:bookingId/check-in", verifyOwnerToken, ProfessionalController.checkIn);

// Cancel route - accessible by both User and Professional (authorization logic inside controller)
router.post("/bookings/:bookingId/cancel", verifyUserToken, ProfessionalController.cancel);

// Admin routes
router.post("/disputes/:disputeId/resolve", verifyAdminToken, ProfessionalController.resolveDispute);

export default router;
