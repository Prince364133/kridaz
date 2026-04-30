import { Router } from "express";
import verifyOwnerToken from "../../middleware/jwt/owner.middleware.js";
import { getOwnerTurfReviews } from "../../modules/review/review.controller.js";

const reviewsRouter = Router();

reviewsRouter.get("/turfs-with-reviews", verifyOwnerToken, getOwnerTurfReviews);

export default reviewsRouter;