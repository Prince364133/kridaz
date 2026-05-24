import { prisma } from "../../config/prisma.js";
import NotificationService from "../../services/notification.service.js";
import logger from "../../utils/logger.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";

/**
 * USER: Raise a new dispute for a booking in the IN_REVIEW_WINDOW
 */
export const raiseDispute = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId, reason, customReason, description } = req.body;

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer, "disputes");
        imageUrls.push(url);
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: {
          id: bookingId,
          userId: userId,
          status: { in: ["CONFIRMED", "PLAYING", "IN_REVIEW_WINDOW"] }
        },
        include: { turf: true }
      });

      if (!booking) {
        throw new Error("Booking not found or not eligible for dispute.");
      }

      // Check if dispute already exists
      const existingDispute = await tx.dispute.findFirst({
        where: { bookingId: booking.id }
      });

      if (existingDispute) {
        throw new Error("A dispute is already active for this booking.");
      }

      // 1. Create the dispute
      const disputeReason = reason === "Other" ? customReason : reason;
      const newDispute = await tx.dispute.create({
        data: {
          bookingId: booking.id,
          raisedById: userId,
          ownerId: booking.turf.ownerId,
          reason: disputeReason,
          description,
          images: imageUrls,
          status: "OPEN",
          bookingDetails: {
            turfName: booking.turf.name,
            playStartTime: booking.playStartTime,
            playEndTime: booking.playEndTime,
            totalPrice: Number(booking.totalPrice),
            ownerRevenue: Number(booking.ownerRevenue)
          }
        }
      });

      // 2. Update Booking Status
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "DISPUTED" }
      });

      // 3. Freeze Funds from Owner
      // Determine where the funds currently reside based on the booking's previous status
      let balanceUpdate = {};
      if (booking.status === "CONFIRMED" || booking.status === "PLAYING") {
        // Funds are still in pendingBalance
        balanceUpdate = {
          pendingBalance: { decrement: booking.ownerRevenue },
          disputeBalance: { increment: booking.ownerRevenue }
        };
      } else if (booking.status === "IN_REVIEW_WINDOW") {
        // Funds are in inProgressBalance
        balanceUpdate = {
          inProgressBalance: { decrement: booking.ownerRevenue },
          disputeBalance: { increment: booking.ownerRevenue }
        };
      }

      const owner = await tx.ownerProfile.update({
        where: { id: booking.turf.ownerId },
        data: balanceUpdate
      });

      await tx.walletTransaction.create({
        data: {
          userId: owner.userId,
          type: "DISPUTE_FREEZE",
          amount: booking.ownerRevenue,
          bookingId: booking.id,
          disputeId: newDispute.id,
          status: "SUCCESS",
          description: `Funds frozen due to dispute on booking ${booking.id}`
        }
      });

      return { newDispute, booking, owner, disputeReason };
    });

    const { newDispute, booking, owner, disputeReason } = result;

    // ── Notifications (Queued) ──────────────────────────────────────────────────────────
    NotificationService.notifyAdmins({
      title: "New Dispute Raised",
      message: `A dispute has been raised for booking ${booking.id} (${disputeReason}).`,
      type: "SUPPORT",
      link: "/admin/disputes"
    });

    if (owner) {
      NotificationService.sendInApp({
        recipientId: owner.id,
        recipientModel: 'Owner',
        title: "Dispute Raised on Booking",
        message: `A user has raised a dispute for your turf booking. Funds have been frozen until resolution.`,
        type: "SUPPORT",
        link: "/venue-owner/dashboard"
      });
    }

    return res.status(201).json({
      success: true,
      message: "Dispute raised successfully.",
      data: newDispute
    });

  } catch (error) {
    logger.error("[DISPUTE] Error raising dispute:", error);
    return res.status(400).json({ 
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
    const userId = req.user.id;

    const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found." });
    }

    if (dispute.status === "RESOLVED") {
      return res.status(400).json({ success: false, message: "Cannot reply to a resolved dispute." });
    }

    const reply = await prisma.disputeReply.create({
      data: {
        disputeId,
        senderId: userId,
        senderType: senderRole || (req.user.role === 'ADMIN' ? 'ADMIN' : 'USER'),
        message,
        images: []
      }
    });

    let newStatus = dispute.status;
    if (senderRole === 'ADMIN' && (dispute.status === "PENDING" || dispute.status === "OPEN")) {
      newStatus = "INVESTIGATING";
    }

    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: newStatus
      },
      include: { replies: true }
    });

    // ── Notifications (Queued) ──────────────────────────────────────────────────────────
    if (senderRole === 'ADMIN' || req.user.role === 'ADMIN') {
      NotificationService.sendInApp({
        recipientId: updatedDispute.raisedById,
        recipientModel: 'User',
        title: "New Message in Dispute",
        message: `An admin has replied to your dispute.`,
        type: "SUPPORT",
        link: "/profile/bookings"
      });
    } else {
      NotificationService.notifyAdmins({
        title: "User replied to Dispute",
        message: `User has replied to the dispute for booking ${updatedDispute.bookingId}.`,
        type: "SUPPORT",
        link: "/admin/disputes"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reply added successfully.",
      data: updatedDispute
    });
  } catch (error) {
    logger.error("[DISPUTE] Error replying to dispute:", error);
    return res.status(500).json({ success: false, message: "Failed to add reply." });
  }
};

/**
 * USER: Get disputes raised by the user
 */
export const getUserDisputes = async (req, res) => {
  try {
    const userId = req.user.id;
    const disputes = await prisma.dispute.findMany({
      where: { raisedById: userId },
      include: {
        booking: {
          select: { qrCode: true, paymentMethod: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, data: disputes });
  } catch (error) {
    logger.error("[DISPUTE] Error fetching user disputes:", error);
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

    const where = {};
    if (status) where.status = status;

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          raisedBy: { select: { name: true, email: true, phone: true } },
          owner: { select: { id: true, businessName: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.dispute.count({ where })
    ]);

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
    logger.error("[DISPUTE] Error fetching all disputes:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch disputes." });
  }
};

/**
 * ADMIN: Get single dispute details
 */
export const getDisputeById = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        raisedBy: { select: { name: true, email: true, phone: true } },
        owner: { select: { id: true, businessName: true } },
        replies: true,
        booking: {
          include: { turf: { select: { name: true, location: true } } }
        }
      }
    });

    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found." });
    }

    return res.status(200).json({ success: true, data: dispute });
  } catch (error) {
    logger.error("[DISPUTE] Error fetching dispute details:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch dispute details." });
  }
};

/**
 * ADMIN: Resolve a dispute (Release funds to owner or Refund to user)
 */
export const resolveDispute = async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { resolutionAction, resolutionNotes, partialAmount } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        include: { booking: true }
      });
      if (!dispute) {
        throw new Error("Dispute not found.");
      }

      if (dispute.status === "RESOLVED") {
        throw new Error("Dispute is already resolved.");
      }

      const booking = dispute.booking;
      const ownerId = dispute.ownerId;
      const ownerRevenue = Number(booking.ownerRevenue);

      if (resolutionAction === "RELEASE_TO_OWNER") {
        if (ownerId) {
          await tx.ownerProfile.update({
            where: { id: ownerId },
            data: {
              disputeBalance: { decrement: ownerRevenue },
              walletBalance: { increment: ownerRevenue }
            }
          });

          const owner = await tx.ownerProfile.findUnique({ where: { id: ownerId } });
          await tx.walletTransaction.create({
            data: {
              userId: owner.userId,
              type: "DISPUTE_RELEASE",
              amount: ownerRevenue,
              bookingId: booking.id,
              disputeId: dispute.id,
              status: "SUCCESS",
              description: `Funds released from dispute for booking ${booking.id}`
            }
          });
        }
        
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: "COMPLETED",
            revenueStatus: "SETTLED",
            settledAt: new Date()
          }
        });

      } else if (resolutionAction === "REFUND_TO_USER") {
        if (ownerId) {
          await tx.ownerProfile.update({
            where: { id: ownerId },
            data: { disputeBalance: { decrement: ownerRevenue } }
          });
        }
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: "CANCELLED",
            revenueStatus: "REFUNDED"
          }
        });
      } else if (resolutionAction === "PARTIAL_REFUND") {
        const pAmount = Number(partialAmount);
        if (!pAmount || pAmount <= 0 || pAmount > ownerRevenue) {
          throw new Error("Invalid partial refund amount.");
        }

        const amountToOwner = ownerRevenue - pAmount;
        
        if (ownerId) {
          await tx.ownerProfile.update({
            where: { id: ownerId },
            data: {
              disputeBalance: { decrement: ownerRevenue },
              walletBalance: { increment: amountToOwner }
            }
          });

          const owner = await tx.ownerProfile.findUnique({ where: { id: ownerId } });
          await tx.walletTransaction.create({
            data: {
              userId: owner.userId,
              type: "DISPUTE_RELEASE",
              amount: amountToOwner,
              bookingId: booking.id,
              disputeId: dispute.id,
              status: "SUCCESS",
              description: `Partial funds released (₹${amountToOwner}) after dispute resolution.`
            }
          });
        }

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: "COMPLETED",
            revenueStatus: "SETTLED"
          }
        });

      } else if (resolutionAction === "CLOSE_NO_ACTION") {
        if (ownerId) {
          await tx.ownerProfile.update({
            where: { id: ownerId },
            data: {
              disputeBalance: { decrement: ownerRevenue },
              walletBalance: { increment: ownerRevenue }
            }
          });
        }
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: "COMPLETED",
            revenueStatus: "SETTLED"
          }
        });
      } else {
        throw new Error("Invalid resolution action.");
      }

      const updatedDispute = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: "RESOLVED",
          resolution: {
            action: resolutionAction,
            notes: resolutionNotes,
            partialAmount: partialAmount || 0,
            resolvedAt: new Date()
          }
        }
      });

      return { dispute: updatedDispute, booking, ownerId };
    });

    const { dispute, booking, ownerId } = result;

    // ── Notifications (Queued) ──────────────────────────────────────────────────────────
    NotificationService.sendInApp({
      recipientId: dispute.raisedById,
      recipientModel: 'User',
      title: "Dispute Resolved",
      message: `The dispute for your booking has been resolved: ${resolutionAction}.`,
      type: "SUPPORT",
      link: "/profile/bookings"
    });

    if (ownerId) {
      NotificationService.sendInApp({
        recipientId: ownerId,
        recipientModel: 'Owner',
        title: "Dispute Resolved",
        message: `The dispute on booking ${booking.id} has been resolved: ${resolutionAction}.`,
        type: "SUPPORT",
        link: "/venue-owner/dashboard"
      });
    }

    return res.status(200).json({
      success: true,
      message: `Dispute resolved successfully. Action: ${resolutionAction}`,
      data: dispute
    });

  } catch (error) {
    logger.error("[DISPUTE] Error resolving dispute:", error);
    return res.status(400).json({ 
      success: false, 
      message: error.message || "Failed to resolve dispute." 
    });
  }
};

