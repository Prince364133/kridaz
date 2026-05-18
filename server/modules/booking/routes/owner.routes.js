import { Router } from "express";
import {
  getOwnerBookings,
  createManualBooking,
} from "../booking.controller.js";
import verifyOwnerToken from "../../../middleware/jwt/owner.middleware.js";

/**
 * @module OwnerBookingRoutes
 * @description Owner-facing booking management endpoints.
 * All routes are mounted under /api/booking/owner (via booking.routes.js).
 */

const router = Router();

/**
 * @swagger
 * /booking/owner/all:
 *   get:
 *     summary: Get all bookings for the owner's turfs
 *     description: Returns a list of all bookings made for any turf owned by the authenticated owner.
 *     tags: [Booking]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of owner bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 */
router.get("/all", verifyOwnerToken, getOwnerBookings);

/**
 * @swagger
 * /booking/owner/manual:
 *   post:
 *     summary: Create a manual (offline) booking
 *     description: Allows a venue owner to create a booking on behalf of a walk-in customer without going through the standard payment flow.
 *     tags: [Booking]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [turfId, startTime, endTime, selectedTurfDate, guestName]
 *             properties:
 *               turfId: { type: string, format: uuid }
 *               startTime: { type: string, example: "10:00" }
 *               endTime: { type: string, example: "11:00" }
 *               selectedTurfDate: { type: string, format: date }
 *               guestName: { type: string }
 *               guestPhone: { type: string }
 *               guestEmail: { type: string, format: email }
 *               totalPrice: { type: number }
 *               paymentMethod: { type: string, enum: [CASH, UPI, CARD], default: CASH }
 *     responses:
 *       201:
 *         description: Manual booking created
 */
router.post("/manual", verifyOwnerToken, createManualBooking);

export default router;
