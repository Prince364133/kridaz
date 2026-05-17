/**
 * @module BookingService
 * @description Pure business logic layer for the Booking domain.
 *
 * ARCHITECTURE RULE: This layer has NO knowledge of HTTP (req/res).
 * Functions here accept plain data and return plain data or throw errors.
 * This makes the logic reusable in:
 *   - Controllers (HTTP handlers)
 *   - Cron jobs (scheduled settlement)
 *   - Admin scripts (manual operations)
 *   - Tests (unit testing without HTTP stack)
 */

import { prisma } from "../../config/prisma.js";
import { BOOKING_STATUS } from "@kridaz/shared-constants/bookingStatus";

/**
 * Checks if a time slot is available for a given turf and date range.
 * @param {string} turfId - The turf to check availability for.
 * @param {Date} startTime - The requested start time.
 * @param {Date} endTime - The requested end time.
 * @returns {Promise<boolean>} True if the slot is available.
 */
export const isSlotAvailable = async (turfId, startTime, endTime) => {
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      turfId,
      status: { notIn: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED] },
      timeSlot: {
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    },
  });
  return !conflictingBooking;
};

/**
 * Fetches full booking details by ID, including turf and user information.
 * @param {string} bookingId - The booking UUID.
 * @returns {Promise<import('@prisma/client').Booking | null>}
 */
export const findBookingById = async (bookingId) => {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      turf: {
        select: {
          id: true,
          name: true,
          location: true,
          city: true,
          state: true,
          owner: { select: { id: true, businessName: true } },
        },
      },
      timeSlot: true,
    },
  });
};

/**
 * Returns all bookings for a specific user, ordered newest first.
 * @param {string} userId - The user's UUID.
 * @returns {Promise<import('@prisma/client').Booking[]>}
 */
export const findBookingsByUser = async (userId) => {
  return prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      turf: { select: { id: true, name: true, city: true, image: true } },
      timeSlot: true,
    },
  });
};

/**
 * Returns all bookings for a given owner (all their turfs combined).
 * @param {string} ownerId - The OwnerProfile UUID.
 * @returns {Promise<import('@prisma/client').Booking[]>}
 */
export const findBookingsByOwner = async (ownerId) => {
  return prisma.booking.findMany({
    where: {
      turf: { ownerId },
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      turf: { select: { id: true, name: true } },
      timeSlot: true,
    },
  });
};

/**
 * Computes the refund amount for a cancellation based on the 30% policy.
 * Only applies when the booking was paid and is in CONFIRMED status.
 * @param {object} booking - The full booking record from Prisma.
 * @returns {number} Refund amount in INR.
 */
export const calculateCancellationRefund = (booking) => {
  if (
    booking.status !== BOOKING_STATUS.CONFIRMED ||
    booking.paymentStatus !== "SUCCESS"
  ) {
    return 0;
  }
  return parseFloat((booking.paidAmount * 0.3).toFixed(2));
};
