import { prisma } from "../config/prisma.js";
import { DispatchService } from "../services/dispatch.service.js";
import { OTPService } from "../services/otp.service.js";
import { CancellationService } from "../services/cancellation.service.js";
import { DisputeService } from "../services/dispute.service.js";
import logger from "../utils/logger.js";

/**
 * ProfessionalController
 * API handlers for On-Demand Professional Matching & Booking Engine.
 */
export class ProfessionalController {
  /**
   * POST /api/professional/match-request
   * Request professional matchmaking.
   */
  static async requestMatch(req, res) {
    try {
      const {
        sport,
        date,
        startTime,
        endTime,
        groundId,
        customLocation,
        roles,
        maxBudget,
        latitude,
        longitude
      } = req.body;

      if (!startTime || !endTime || !roles || !roles.length || !maxBudget || !latitude || !longitude) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
      }

      // Check user wallet balance
      const wallet = await prisma.wallet.findUnique({
        where: { userId: req.user.id }
      });

      if (!wallet) {
        return res.status(400).json({ success: false, message: "Wallet not found. Please recharge." });
      }

      const usableBalance = Number(wallet.balance) - Number(wallet.reservedBalance);
      if (usableBalance < parseFloat(maxBudget)) {
        return res.status(400).json({ success: false, message: "Insufficient wallet. Please recharge." });
      }

      // Create professional match request
      const request = await prisma.professionalMatchRequest.create({
        data: {
          userId: req.user.id,
          groundId,
          customLocation,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          roles,
          minBudget: 0.00,
          maxBudget: parseFloat(maxBudget),
          matchDate: date,
          matchStartTime: startTime,
          matchEndTime: endTime,
          status: "SEARCHING",
          expiresAt: new Date(Date.now() + 120000) // 2 minutes request expiry
        }
      });

      // Start dispatch process
      const dispatchStarted = await DispatchService.startDispatch(request.id);

      if (!dispatchStarted) {
        // Fetch request to check if it transitioned to EXHAUSTED/FAILED
        const updatedReq = await prisma.professionalMatchRequest.findUnique({
          where: { id: request.id }
        });
        return res.status(200).json({
          success: false,
          status: updatedReq?.status || "EXHAUSTED",
          message: "No professionals available near this location. Try a different time, location, or budget."
        });
      }

      const booking = await prisma.onDemandProfessionalBooking.findUnique({
        where: { requestId: request.id }
      });

      return res.status(201).json({
        success: true,
        bookingId: booking?.id || null,
        status: "PENDING",
        message: "Match request successfully created. Finding professional..."
      });
    } catch (error) {
      logger.error("[ProfessionalController] Error in requestMatch:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/professional/offers/:notificationId/respond
   * Professional accepts or rejects a match offer.
   */
  static async respondToOffer(req, res) {
    try {
      const { notificationId } = req.params;
      const { response } = req.body; // "ACCEPT" or "REJECT"

      if (!response || !["ACCEPT", "REJECT"].includes(response)) {
        return res.status(400).json({ success: false, message: "Invalid response action." });
      }

      const proProfile = await prisma.ownerProfile.findUnique({
        where: { userId: req.user.id }
      });

      if (!proProfile) {
        return res.status(404).json({ success: false, message: "Professional profile not found." });
      }

      const result = await DispatchService.handleOfferResponse(notificationId, proProfile.id, response);

      if (!result.success) {
        return res.status(result.status || 400).json({ success: false, message: result.message });
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error("[ProfessionalController] Error in respondToOffer:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/professional/bookings/:bookingId/check-in
   * OTP check-in validator.
   */
  static async checkIn(req, res) {
    try {
      const { bookingId } = req.params;
      const { otp } = req.body;

      if (!otp) {
        return res.status(400).json({ success: false, message: "OTP code is required." });
      }

      const result = await OTPService.verifyOTPCheckIn(bookingId, otp);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      logger.error("[ProfessionalController] Error in checkIn:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/professional/bookings/:bookingId/cancel
   * Cancel booking (User or Professional).
   */
  static async cancel(req, res) {
    try {
      const { bookingId } = req.params;

      const booking = await prisma.onDemandProfessionalBooking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
      }

      let actorType = null;
      if (booking.userId === req.user.id) {
        actorType = "USER";
      } else {
        const proProfile = await prisma.ownerProfile.findUnique({
          where: { userId: req.user.id }
        });
        if (proProfile && booking.professionalId === proProfile.id) {
          actorType = "PROFESSIONAL";
        }
      }

      if (!actorType) {
        return res.status(403).json({ success: false, message: "Unauthorized to cancel this booking." });
      }

      const result = await CancellationService.cancelBooking(bookingId, actorType);
      return res.status(200).json(result);
    } catch (error) {
      logger.error("[ProfessionalController] Error in cancel booking:", error);
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/professional/disputes
   * User raises a dispute ticket.
   */
  static async raiseDispute(req, res) {
    try {
      const { bookingId, reason, description, images } = req.body;

      if (!bookingId || !reason || !description) {
        return res.status(400).json({ success: false, message: "Missing required dispute fields." });
      }

      const booking = await prisma.onDemandProfessionalBooking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        return res.status(404).json({ success: false, message: "Booking not found." });
      }

      if (booking.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: "Unauthorized to dispute this booking." });
      }

      const dispute = await DisputeService.raiseDispute(bookingId, req.user.id, reason, description, images || []);
      return res.status(201).json({ success: true, disputeId: dispute.id, status: dispute.status });
    } catch (error) {
      logger.error("[ProfessionalController] Error raising dispute:", error);
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * POST /api/professional/disputes/:disputeId/resolve
   * Admin resolves dispute.
   */
  static async resolveDispute(req, res) {
    try {
      const { disputeId } = req.params;
      const { outcome, refundPercentage } = req.body;

      if (!outcome || !["FULL_REFUND", "RELEASE_TO_UMPIRE", "PARTIAL_REFUND"].includes(outcome)) {
        return res.status(400).json({ success: false, message: "Invalid dispute resolution outcome." });
      }

      if (req.user.role?.toUpperCase() !== "ADMIN") {
        return res.status(403).json({ success: false, message: "Unauthorized: Admin access required." });
      }

      await DisputeService.resolveDispute(disputeId, outcome, req.user.id, refundPercentage || 0);
      return res.status(200).json({ success: true, message: "Dispute resolved successfully." });
    } catch (error) {
      logger.error("[ProfessionalController] Error resolving dispute:", error);
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}
