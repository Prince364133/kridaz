import express from "express";
import { 
  createOrder, 
  verifyPayment, 
  getUserBookings,
  getOwnerBookings,
  getBookingById,
  downloadInvoice,
  cancelBooking
} from "./booking.controller.js";
import { createOrderSchema, verifyPaymentSchema } from "./booking.validator.js";
import { validate } from "../../middleware/validate.middleware.js";
import verifyUserToken from "../../middleware/jwt/user.middleware.js";
import verifyOwnerToken from "../../middleware/jwt/owner.middleware.js";
import verifyAuth from "../../middleware/jwt/auth.middleware.js";

const router = express.Router();

// User routes
router.post("/user/order", verifyUserToken, validate(createOrderSchema), createOrder);
router.post("/user/verify", verifyUserToken, validate(verifyPaymentSchema), verifyPayment);
router.get("/user/all", verifyUserToken, getUserBookings);
router.get("/:id", getBookingById); // Made public for QR code access or simplified access
router.get("/user/invoice/:id", downloadInvoice); // Public for direct access via link as per request
router.post("/user/cancel/:id", verifyUserToken, cancelBooking);


// Owner routes
router.get("/owner/all", verifyOwnerToken, getOwnerBookings);

export default router;
