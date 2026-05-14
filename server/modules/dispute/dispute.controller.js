import mongoose from "mongoose";
import Booking from "../../models/booking.model.js";
import Dispute from "../../models/dispute.model.js";
import Owner from "../../models/owner.model.js";
import WalletTransaction from "../../models/walletTransaction.model.js";
import Turf from "../../models/turf.model.js";
import { createNotification, notifyAdmins } from "../../utils/notificationHelper.js";
import { runInTransaction } from "../../utils/transaction.js";


/**
 * USER: Raise a new dispute for a booking in the IN_REVIEW_WINDOW
 */
export const raiseDispute = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId, reason, customReason, description, images } = req.body;

    const result = await runInTransaction(async ({ session }) => {
      const booking = await Booking.findOne({
        _id: bookingId,
        user: userId,
        status: "IN_REVIEW_WINDOW"
      }).populate("turf").session(session);

      if (!booking) {
        throw { status: 400, message: "Booking not found or not eligible for dispute." };
      }

      if (booking.dispute) {
        throw { status: 400, message: "A dispute is already active for this booking." };
      }

      // 1. Create the dispute
      const disputeReason = reason === "Other" ? customReason : reason;
      const newDispute = await Dispute.create(
        [
          {
            booking: booking._id,
            raisedBy: userId,
            turfOwner: booking.turf.owner,
            reason: disputeReason,
            description,
            images: images || [],
            status: "OPEN",
            bookingDetails: {
              turfName: booking.turf.name,
              playStartTime: booking.playStartTime,
              playEndTime: booking.playEndTime,
              totalPrice: booking.totalPrice,
              ownerRevenue: booking.ownerRevenue
            }
          }
        ],
        { session }
      );

      // 2. Update Booking Status
      booking.status = "DISPUTED";
      booking.dispute = newDispute[0]._id;
      await booking.save({ session });

      // 3. Freeze Funds from Owner (Move from inProgress to disputeBalance)
      const owner = await Owner.findById(booking.turf.owner).session(session);
      if (owner) {
        owner.inProgressBalance -= booking.ownerRevenue;
        owner.disputeBalance += booking.ownerRevenue;
        await owner.save({ session });

        await WalletTransaction.create(
          [
            {
              user: owner.userId || owner._id,
              type: "DISPUTE_FREEZE",
              amount: booking.ownerRevenue,
              bookingId: booking._id,
              disputeId: newDispute[0]._id,
              status: "SUCCESS",
              description: `Funds frozen due to dispute on booking ${booking._id}`
            }
          ],
          { session }
        );
      }

      return { newDispute: newDispute[0], booking, owner, disputeReason };
    });

    const { newDispute, booking, owner, disputeReason } = result;

    // ── Notifications ──────────────────────────────────────────────────────────
    // Notify Admin
    await notifyAdmins({
      title: "New Dispute Raised",
      message: `A dispute has been raised for booking ${booking._id} (${disputeReason}).`,
      type: "SUPPORT",
      link: "/admin/disputes"
    });

    // Notify Owner
    if (owner) {
      await createNotification({
        recipientId: owner._id,
        recipientModel: 'Owner',
        title: "Dispute Raised on Booking",
        message: `A user has raised a dispute for your turf booking. Funds have been frozen until resolution.`,
        type: "SUPPORT",
        link: "/partner/dashboard"
      });
    }

    return res.status(201).json({
      success: true,
      message: "Dispute raised successfully.",
      data: newDispute
    });

  } catch (error) {
    console.error("[DISPUTE] Error raising dispute:", error);
    return res.status(error.status || 500).json({ 
      success: false, 
      message: error.message || "Failed to raise dispute." 
    });
  }
};

/**
 * USER/ADMIN: Add a reply to a dispute thread
 */
export const replyToDispute = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { message, senderRole } = req.body; // 'USER' or 'ADMIN'
    const userId = req.user._id || req.user.id;

    const dispute = await Dispute.findById(disputeId);
    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found." });
    }

    if (dispute.status === "RESOLVED") {
      return res.status(400).json({ success: false, message: "Cannot reply to a resolved dispute." });
    }

    dispute.replies.push({
      senderId: userId,
      senderRole: senderRole || (req.user.role === 'ADMIN' ? 'ADMIN' : 'USER'),
      message,
      createdAt: new Date()
    });

    if (senderRole === 'ADMIN' && dispute.status === "PENDING") {
      dispute.status = "INVESTIGATING";
    }

    dispute.lastRepliedAt = new Date();
    await dispute.save();

    // ── Notifications ──────────────────────────────────────────────────────────
    if (senderRole === 'ADMIN' || req.user.role === 'ADMIN') {
      // Notify User
      await createNotification({
        recipientId: dispute.raisedBy,
        recipientModel: 'User',
        title: "New Message in Dispute",
        message: `An admin has replied to your dispute regarding ${dispute.bookingDetails?.turfName}.`,
        type: "SUPPORT",
        link: "/profile/bookings"
      });
    } else {
      // Notify Admin
      await notifyAdmins({
        title: "User replied to Dispute",
        message: `User has replied to the dispute for booking ${dispute.booking}.`,
        type: "SUPPORT",
        link: "/admin/disputes"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reply added successfully.",
      data: dispute
    });
  } catch (error) {
    console.error("[DISPUTE] Error replying to dispute:", error);
    return res.status(500).json({ success: false, message: "Failed to add reply." });
  }
};

/**
 * USER: Get disputes raised by the user
 */
export const getUserDisputes = async (req, res) => {
  try {
    const userId = req.user.id;
    const disputes = await Dispute.find({ raisedBy: userId })
      .populate("booking", "qrCode paymentMethod")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: disputes });
  } catch (error) {
    console.error("[DISPUTE] Error fetching user disputes:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch disputes." });
  }
};

/**
 * ADMIN: List all disputes
 */
export const getAllDisputes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;

    const query = {};
    if (status) query.status = status;

    const disputes = await Dispute.find(query)
      .populate("raisedBy", "name email phone")
      .populate("turfOwner", "userId name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Dispute.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: disputes,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("[DISPUTE] Error fetching all disputes:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch disputes." });
  }
};

/**
 * ADMIN: Get single dispute details
 */
export const getDisputeById = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const dispute = await Dispute.findById(disputeId)
      .populate("raisedBy", "name email phone")
      .populate("turfOwner", "userId name")
      .populate({
        path: "booking",
        populate: { path: "turf", select: "name location" }
      });

    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found." });
    }

    return res.status(200).json({ success: true, data: dispute });
  } catch (error) {
    console.error("[DISPUTE] Error fetching dispute details:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch dispute details." });
  }
};

/**
 * ADMIN: Resolve a dispute (Release funds to owner or Refund to user)
 */
export const resolveDispute = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { resolutionAction, resolutionNotes, partialAmount } = req.body; // 'RELEASE_TO_OWNER', 'REFUND_TO_USER', 'PARTIAL_REFUND', 'CLOSE_NO_ACTION'

    const result = await runInTransaction(async ({ session }) => {
      const dispute = await Dispute.findById(disputeId).session(session);
      if (!dispute) {
        throw { status: 404, message: "Dispute not found." };
      }

      if (dispute.status === "RESOLVED") {
        throw { status: 400, message: "Dispute is already resolved." };
      }

      const booking = await Booking.findById(dispute.booking).session(session);
      const owner = await Owner.findById(dispute.turfOwner).session(session);

      if (resolutionAction === "RELEASE_TO_OWNER") {
        // 1. Move funds from disputeBalance to walletBalance
        if (owner) {
          // Atomic: deduct disputeBalance, credit walletBalance
          await Owner.findByIdAndUpdate(
            dispute.turfOwner,
            { $inc: {
                disputeBalance: -dispute.bookingDetails.ownerRevenue,
                walletBalance: dispute.bookingDetails.ownerRevenue
            }},
            { session }
          );

          await WalletTransaction.create(
            [
              {
                user: owner.userId || owner._id,
                type: "DISPUTE_RELEASE",
                amount: dispute.bookingDetails.ownerRevenue,
                bookingId: booking._id,
                disputeId: dispute._id,
                status: "SUCCESS",
                description: `Funds released from dispute for booking ${booking._id}`
              }
            ],
            { session }
          );
        }
        
        // 2. Mark booking as COMPLETED
        booking.status = "COMPLETED";
        booking.revenueStatus = "SETTLED";
        booking.settledAt = new Date();
        await booking.save({ session });

      } else if (resolutionAction === "REFUND_TO_USER") {
        // 1. Deduct funds from owner's dispute balance (money vanishes from owner)
        if (owner) {
          // Atomic: deduct disputeBalance only (funds do not go to wallet — refund policy)
          await Owner.findByIdAndUpdate(
            dispute.turfOwner,
            { $inc: { disputeBalance: -dispute.bookingDetails.ownerRevenue } },
            { session }
          );
        }

        // 2. We do NOT refund standard user wallet directly right now unless requested by Kridaz policy
        // But we CAN mark booking as CANCELLED so it's clear
        booking.status = "CANCELLED";
        booking.revenueStatus = "REFUNDED";
        await booking.save({ session });
      } else if (resolutionAction === "PARTIAL_REFUND") {
        if (!partialAmount || partialAmount <= 0 || partialAmount > dispute.bookingDetails.ownerRevenue) {
          throw { status: 400, message: "Invalid partial refund amount." };
        }

        // 1. Release partial amount to owner, rest vanishes (refunded in policy)
        const amountToOwner = dispute.bookingDetails.ownerRevenue - partialAmount;
        
        if (owner) {
          // Atomic: deduct full disputeBalance, credit only partial amount to wallet
          await Owner.findByIdAndUpdate(
            dispute.turfOwner,
            { $inc: {
                disputeBalance: -dispute.bookingDetails.ownerRevenue,
                walletBalance: amountToOwner
            }},
            { session }
          );

          await WalletTransaction.create([
            {
              user: owner.userId || owner._id,
              type: "DISPUTE_RELEASE",
              amount: amountToOwner,
              bookingId: booking._id,
              disputeId: dispute._id,
              status: "SUCCESS",
              description: `Partial funds released (₹${amountToOwner}) after dispute resolution.`
            }
          ], { session });
        }

        booking.status = "COMPLETED"; // Or a new status like PARTIALLY_REFUNDED
        booking.revenueStatus = "SETTLED";
        await booking.save({ session });

      } else if (resolutionAction === "CLOSE_NO_ACTION") {
        // Just release all to owner (standard close)
        if (owner) {
          // Atomic: deduct disputeBalance, credit walletBalance (no action = standard release)
          await Owner.findByIdAndUpdate(
            dispute.turfOwner,
            { $inc: {
                disputeBalance: -dispute.bookingDetails.ownerRevenue,
                walletBalance: dispute.bookingDetails.ownerRevenue
            }},
            { session }
          );
        }
        booking.status = "COMPLETED";
        booking.revenueStatus = "SETTLED";
        await booking.save({ session });
      } else {
        throw { status: 400, message: "Invalid resolution action." };
      }

      dispute.resolvedAt = new Date();
      await dispute.save({ session });

      return { dispute, booking, owner };
    });

    const { dispute, booking, owner } = result;

    // ── Notifications ──────────────────────────────────────────────────────────
    // Notify User
    await createNotification({
      recipientId: dispute.raisedBy,
      recipientModel: 'User',
      title: "Dispute Resolved",
      message: `The dispute for your booking has been resolved: ${resolutionAction}. Notes: ${resolutionNotes || "None"}`,
      type: "SUPPORT",
      link: "/profile/bookings"
    });

    // Notify Owner
    if (owner) {
      await createNotification({
        recipientId: owner._id,
        recipientModel: 'Owner',
        title: "Dispute Resolved",
        message: `The dispute on booking ${booking._id} has been resolved: ${resolutionAction}. Funds have been adjusted accordingly.`,
        type: "SUPPORT",
        link: "/partner/dashboard"
      });
    }

    return res.status(200).json({
      success: true,
      message: `Dispute resolved successfully. Action: ${resolutionAction}`,
      data: dispute
    });

  } catch (error) {
    console.error("[DISPUTE] Error resolving dispute:", error);
    return res.status(error.status || 500).json({ 
      success: false, 
      message: error.message || "Failed to resolve dispute." 
    });
  }
};


