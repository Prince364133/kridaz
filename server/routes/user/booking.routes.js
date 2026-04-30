import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  getUserBookings,
} from "../../modules/booking/booking.controller.js";
import verifyToken from "../../middleware/jwt/user.middleware.js";
import { createOrderSchema, verifyPaymentSchema } from "../../modules/booking/booking.validator.js";
import { validate } from "../../middleware/validate.middleware.js";

const bookingRouter = Router();

bookingRouter.post("/create-order", verifyToken, validate(createOrderSchema), createOrder);
bookingRouter.post("/verify-payment", verifyToken, validate(verifyPaymentSchema), verifyPayment);
bookingRouter.get("/get-bookings", verifyToken, getUserBookings);

export default bookingRouter;
