import { Router } from "express";
import { getOwnerBookings, createManualBooking } from "../../modules/booking/booking.controller.js";
import verifyOwnerToken from "../../middleware/jwt/owner.middleware.js";

const bookingsRouter = Router();

bookingsRouter.get("/", verifyOwnerToken, getOwnerBookings);
bookingsRouter.post("/manual", verifyOwnerToken, createManualBooking);

export default bookingsRouter;