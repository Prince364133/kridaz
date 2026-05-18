import { Router } from "express";
import { getAdminAllBookings } from "../booking.controller.js";
import verifyAdminToken from "../../../middleware/jwt/admin.middleware.js";

/**
 * @module AdminBookingRoutes
 * @description Admin-facing booking oversight and moderation endpoints.
 * All routes are mounted under /api/booking/admin (via booking.routes.js).
 */

const router = Router();

/**
 * @swagger
 * /booking/admin/all:
 *   get:
 *     summary: Get all bookings (Admin)
 *     description: Returns a platform-wide view of all bookings across all turfs, with full details for moderation.
 *     tags: [Booking]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PLAYING, COMPLETED, DISPUTED, CANCELLED]
 *         description: Filter bookings by status
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of all bookings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get("/all", verifyAdminToken, getAdminAllBookings);

export default router;
