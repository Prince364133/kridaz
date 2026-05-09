import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  bookWithWallet,
  getUserBookings,
  getBookingById,
  validateCoupon,
} from "../../modules/booking/booking.controller.js";
import verifyToken from "../../middleware/jwt/user.middleware.js";
import { createOrderSchema, verifyPaymentSchema, bookWithWalletSchema } from "../../modules/booking/booking.validator.js";
import { validate } from "../../middleware/validate.middleware.js";

const bookingRouter = Router();

bookingRouter.post("/create-order", verifyToken, validate(createOrderSchema), createOrder);
bookingRouter.post("/verify-payment", verifyToken, validate(verifyPaymentSchema), verifyPayment);
bookingRouter.post("/book-with-wallet", verifyToken, validate(bookWithWalletSchema), bookWithWallet);
bookingRouter.post("/validate-coupon", verifyToken, validateCoupon);
bookingRouter.get("/get-bookings", verifyToken, getUserBookings);
bookingRouter.get("/:id", getBookingById);

export default bookingRouter;
