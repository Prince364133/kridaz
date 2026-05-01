import { Router } from "express";
import { getOwnerBookings } from "../../modules/booking/booking.controller.js";
import verifyOwnerToken from "../../middleware/jwt/owner.middleware.js";

const bookingsRouter = Router();

bookingsRouter.get("/", verifyOwnerToken, getOwnerBookings);

export default bookingsRouter;