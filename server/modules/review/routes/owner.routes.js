import { Router } from "express";
import verifyOwnerToken from "../../../middleware/jwt/owner.middleware.js";
import { getOwnerTurfReviews } from "../review.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Owner Review
 *   description: Turf ratings and feedback management for owners
 */

/**
 * @swagger
 * /review/owner/turfs-with-reviews:
 *   get:
 *     summary: Get reviews for owner turfs
 *     tags: [Owner Review]
 *     security:
 *       - BearerAuth: []
 */
router.get("/turfs-with-reviews", verifyOwnerToken, getOwnerTurfReviews);

export default router;
