import { Router } from "express";
import userBookingRouter from "./routes/user.routes.js";
import ownerBookingRouter from "./routes/owner.routes.js";
import adminBookingRouter from "./routes/admin.routes.js";

/**
 * @module BookingRouter
 * @description Main entry point for the Booking domain. This router acts as a
 * dispatcher, routing traffic to the correct actor-specific sub-router.
 *
 * URL Structure:
 *   POST /api/booking/user/create-order
 *   POST /api/booking/user/verify-payment
 *   POST /api/booking/user/book-with-wallet
 *   POST /api/booking/user/validate-coupon
 *   GET  /api/booking/user/all
 *   POST /api/booking/user/cancel/:id
 *   GET  /api/booking/user/invoice/:id
 *   GET  /api/booking/user/:id
 *
 *   GET  /api/booking/owner/all
 *   POST /api/booking/owner/manual
 *
 *   GET  /api/booking/admin/all
 *
 * For business rules and domain context, see: ./README.md
 */

const bookingRouter = Router();

bookingRouter.use("/user", userBookingRouter);
bookingRouter.use("/owner", ownerBookingRouter);
bookingRouter.use("/admin", adminBookingRouter);

export default bookingRouter;
