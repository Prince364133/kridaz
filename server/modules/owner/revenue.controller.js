import mongoose from "mongoose";
import Owner from "../../models/owner.model.js";
import Turf from "../../models/turf.model.js";
import Booking from "../../models/booking.model.js";
import WalletTransaction from "../../models/walletTransaction.model.js";

/**
 * Get unified revenue summary for the owner dashboard
 * Returns exactly the fields needed for the 6 top-row cards plus in-progress bookings.
 */
export const getRevenueSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Resolve owner record
    const ownerRecord = await Owner.findOne({
      $or: [{ _id: userId }, { userId: userId }]
    });

    if (!ownerRecord) {
      return res.status(404).json({ success: false, message: "Owner profile not found." });
    }

    const ownerId = ownerRecord._id;

    // Find all turfs belonging to this owner
    const turfs = await Turf.find({ owner: ownerId }).select("_id name").lean();
    const turfIds = turfs.map(t => t._id);

    // 1. Total Revenue: Sum of ownerRevenue for all COMPLETED bookings
    const completedBookingsAggr = await Booking.aggregate([
      { $match: { turf: { $in: turfIds }, status: "COMPLETED" } },
      { $group: { _id: null, total: { $sum: "$ownerRevenue" } } }
    ]);
    const totalRevenue = completedBookingsAggr.length > 0 ? completedBookingsAggr[0].total : 0;

    // 2. Pending Settlements: Sum of ownerRevenue for CONFIRMED bookings in the future
    const pendingAggr = await Booking.aggregate([
      { $match: { turf: { $in: turfIds }, status: "CONFIRMED" } },
      { $group: { _id: null, total: { $sum: "$ownerRevenue" } } }
    ]);
    const pendingSettlements = pendingAggr.length > 0 ? pendingAggr[0].total : 0;

    // 3. In-Progress Bookings (Review Window countdown)
    const inProgressBookings = await Booking.find({
      turf: { $in: turfIds },
      status: "IN_REVIEW_WINDOW",
      revenueStatus: "IN_PROGRESS"
    })
      .select("turf playStartTime reviewWindowEndsAt ownerRevenue")
      .populate("turf", "name")
      .sort({ reviewWindowEndsAt: 1 })
      .lean();

    // 4. Recent relevant wallet transactions (Settlements, Withdrawals, Disputes)
    const recentTransactions = await WalletTransaction.find({
      user: ownerRecord.userId || ownerId,
      type: { $in: ["SETTLEMENT", "WITHDRAWAL", "DISPUTE_FREEZE", "DISPUTE_RELEASE"] }
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        balances: {
          usable: ownerRecord.walletBalance || 0,
          inProgress: ownerRecord.inProgressBalance || 0,
          dispute: ownerRecord.disputeBalance || 0,
          withdrawn: ownerRecord.withdrawnBalance || 0,
          totalRevenue,
          pendingSettlements
        },
        inProgressBookings,
        recentTransactions
      }
    });

  } catch (error) {
    console.error("[REVENUE API] Summary error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching revenue summary." });
  }
};

/**
 * Get paginated list of revenue-related transactions
 */
export const getRevenueTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const ownerRecord = await Owner.findOne({
      $or: [{ _id: userId }, { userId: userId }]
    });

    if (!ownerRecord) {
      return res.status(404).json({ success: false, message: "Owner profile not found." });
    }

    const query = {
      user: ownerRecord.userId || ownerRecord._id,
      type: { $in: ["SETTLEMENT", "REVENUE", "WITHDRAWAL", "DISPUTE_FREEZE", "DISPUTE_RELEASE", "HOST_GAME", "JOIN_GAME"] }
    };

    const transactions = await WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("bookingId", "playStartTime turf")
      .populate("disputeId", "status resolution")
      .lean();

    const total = await WalletTransaction.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error("[REVENUE API] Transactions error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching transactions." });
  }
};
