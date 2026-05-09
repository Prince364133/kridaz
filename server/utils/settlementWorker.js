import Booking from "../models/booking.model.js";
import Owner from "../models/owner.model.js";
import WalletTransaction from "../models/walletTransaction.model.js";
import TimeSlot from "../models/timeSlot.model.js";
import mongoose from "mongoose";

/**
 * Settlement Worker
 * Periodically checks for bookings that have completed and transfers 
 * pending balance to confirmed wallet balance after 12 hours.
 */
const runSettlementCheck = async () => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        console.log("[SETTLEMENT] Starting settlement check...");
        
        // 1. Find bookings with PENDING revenue
        // We need to join with TimeSlot to check endTime
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

        const pendingBookings = await Booking.find({
            revenueStatus: "PENDING",
            // We only settle confirmed or completed bookings
            status: { $in: ["CONFIRMED", "COMPLETED"] } 
        }).populate("timeSlot").populate({
            path: "turf",
            populate: {
                path: "owner",
                select: "userId"
            }
        });

        let settledCount = 0;

        for (const booking of pendingBookings) {
            if (!booking.timeSlot || !booking.timeSlot.endTime) continue;
            if (!booking.turf || !booking.turf.owner) continue;

            // Check if 12 hours have passed since the booking ended
            if (new Date(booking.timeSlot.endTime) <= twelveHoursAgo) {
                const owner = booking.turf.owner;
                const ownerId = owner._id;
                const userId = owner.userId || ownerId; // Fallback to ownerId if userId not linked
                const amount = booking.totalPrice;

                // Move balance from pending to confirmed
                await Owner.findByIdAndUpdate(ownerId, {
                    $inc: { 
                        pendingBalance: -amount,
                        walletBalance: amount
                    }
                }, { session });

                // Create a REVENUE transaction for the owner's user account
                await WalletTransaction.create([{
                    user: userId,
                    amount: amount,
                    type: "REVENUE",
                    status: "SUCCESS",
                    description: `Revenue for booking #${booking._id.toString().slice(-6).toUpperCase()} at ${booking.turf.name || 'Ground'}`,
                    bookingId: booking._id
                }], { session });

                // Update booking revenue status
                booking.revenueStatus = "CONFIRMED";
                await booking.save({ session });

                settledCount++;
            }
        }

        await session.commitTransaction();
        if (settledCount > 0) {
            console.log(`[SETTLEMENT] Successfully settled ${settledCount} bookings.`);
        }
    } catch (error) {
        await session.abortTransaction();
        console.error("[SETTLEMENT] Error during settlement check:", error);
    } finally {
        session.endSession();
    }
};

// Run every hour
export const initSettlementWorker = () => {
    console.log("[SETTLEMENT] Initializing Revenue Settlement Worker (1hr interval)");
    // Run immediately on start
    runSettlementCheck();
    // Then every hour
    setInterval(runSettlementCheck, 60 * 60 * 1000); 
};
