import express from "express";
import {
  addReview,
  viewReviewsByTurf,
} from "../../modules/review/review.controller.js";
import verifyUserToken from "../../middleware/jwt/user.middleware.js";

const reviewRouter = express.Router();

reviewRouter.post("/:id", verifyUserToken, addReview);
reviewRouter.get("/:id", viewReviewsByTurf);

export default reviewRouter;
