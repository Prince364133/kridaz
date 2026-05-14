import mongoose from "mongoose";
import chalk from "chalk";
import Booking from "../models/booking.model.js";
import Owner from "../models/owner.model.js";
import WalletTransaction from "../models/walletTransaction.model.js";
import TimeSlot from "../models/timeSlot.model.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Backfill playStartTime / playEndTime on older CONFIRMED bookings that were
 * created before the Phase 1 schema migration added those fields.
 * Only runs once on startup — finds bookings with status=CONFIRMED and no
 * playStartTime, then copies times from their linked TimeSlot document.
 */
const backfillPlayTimes = async () => {
  try {
    const stale = await Booking.find({
      status: "CONFIRMED",
      playStartTime: { $exists: false },
      timeSlot: { $exists: true, $ne: null },
    }).select("_id timeSlot");

    if (stale.length === 0) return;

    const slotIds = stale.map((b) => b.timeSlot);
    const slots = await TimeSlot.find({ _id: { $in: slotIds } }).lean();
    const slotMap = Object.fromEntries(slots.map((s) => [s._id.toString(), s]));

    const bulkOps = stale
      .filter((b) => slotMap[b.timeSlot?.toString()])
      .map((b) => {
        const slot = slotMap[b.timeSlot.toString()];
        return {
          updateOne: {
            filter: { _id: b._id },
            update: {
              $set: {
                playStartTime: slot.startTime,
                playEndTime: slot.endTime,
              },
            },
          },
        };
      });

    if (bulkOps.length > 0) {
      await Booking.bulkWrite(bulkOps);
      console.log(
        chalk.cyan(`[SETTLEMENT] Backfilled playStartTime on ${bulkOps.length} legacy bookings.`)
      );
    }
  } catch (err) {
    console.error(chalk.red("[SETTLEMENT] Backfill error:"), err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase A — CONFIRMED → PLAYING → IN_REVIEW_WINDOW
// Runs every 5 minutes.
//
// Logic:
//   1. Find CONFIRMED bookings where playStartTime <= now
//      → status = "PLAYING"   (play has started but not ended yet)
//   2. Find PLAYING bookings where playEndTime <= now
//      → status = "IN_REVIEW_WINDOW"
//      → revenueStatus = "IN_PROGRESS"
//      → reviewWindowEndsAt = playEndTime + 2 hours
//      → owner.pendingBalance  -= ownerRevenue
//      → owner.inProgressBalance += ownerRevenue
// ─────────────────────────────────────────────────────────────────────────────
export const runPlayingTransition = async () => {
  const now = new Date();

  // ── Step 1: CONFIRMED → PLAYING ──────────────────────────────────────────
  try {
    const result = await Booking.updateMany(
      {
        status: "CONFIRMED",
        playStartTime: { $lte: now },
      },
      { $set: { status: "PLAYING" } }
    );
    if (result.modifiedCount > 0) {
      console.log(
        chalk.blue(`[SETTLEMENT] Phase A-1: ${result.modifiedCount} booking(s) → PLAYING`)
      );
    }
  } catch (err) {
    console.error(chalk.red("[SETTLEMENT] Phase A-1 error:"), err.message);
  }

  // ── Step 2: PLAYING → IN_REVIEW_WINDOW ───────────────────────────────────
  const playingBookings = await Booking.find({
    status: "PLAYING",
    playEndTime: { $lte: now },
  })
    .populate({
      path: "turf",
      populate: { path: "owner", select: "_id userId pendingBalance inProgressBalance" },
    })
    .lean();

  if (playingBookings.length === 0) return;

  const isReplicaSet = mongoose.connection.host.includes('replica') || mongoose.connection.replicaSet;
  const session = isReplicaSet ? await mongoose.startSession() : null;
  if (session) session.startTransaction();
  
  try {
    for (const booking of playingBookings) {
      if (!booking.turf?.owner) continue;

      const reviewWindowEndsAt = new Date(booking.playEndTime.getTime() + 2 * 60 * 60 * 1000);
      const ownerRevenue = booking.ownerRevenue || booking.totalPrice;

      // Shift funds: pendingBalance → inProgressBalance
      await Owner.findByIdAndUpdate(
        booking.turf.owner._id,
        {
          $inc: {
            pendingBalance: -ownerRevenue,
            inProgressBalance: ownerRevenue,
          },
        },
        { session }
      );

      await Booking.findByIdAndUpdate(
        booking._id,
        {
          $set: {
            status: "IN_REVIEW_WINDOW",
            revenueStatus: "IN_PROGRESS",
            reviewWindowEndsAt,
          },
        },
        { session }
      );
    }

    if (session) await session.commitTransaction();
    console.log(
      chalk.blue(
        `[SETTLEMENT] Phase A-2: ${playingBookings.length} booking(s) → IN_REVIEW_WINDOW`
      )
    );
  } catch (err) {
    if (session) await session.abortTransaction();
    console.error(chalk.red("[SETTLEMENT] Phase A-2 error:"), err.message);
  } finally {
    if (session) session.endSession();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase B — IN_REVIEW_WINDOW → COMPLETED  (auto-settle)
// Runs every 15 minutes.
//
// Logic:
//   Find IN_REVIEW_WINDOW bookings where reviewWindowEndsAt <= now AND
//   revenueStatus is still IN_PROGRESS (no dispute raised — disputes change it
//   to FROZEN immediately).
//
//   For each:
//     → booking.status           = "COMPLETED"
//     → booking.revenueStatus    = "SETTLED"
//     → booking.settledAt        = now
//     → owner.inProgressBalance -= ownerRevenue
//     → owner.walletBalance     += ownerRevenue
//     → Create WalletTransaction (type: "SETTLEMENT", status: "SUCCESS")
// ─────────────────────────────────────────────────────────────────────────────
export const runAutoSettle = async () => {
  const now = new Date();

  const eligibleBookings = await Booking.find({
    status: "IN_REVIEW_WINDOW",
    revenueStatus: "IN_PROGRESS",
    reviewWindowEndsAt: { $lte: now },
  })
    .populate({
      path: "turf",
      select: "name owner",
      populate: { path: "owner", select: "_id userId" },
    })
    .lean();

  if (eligibleBookings.length === 0) return;

  const isReplicaSet = mongoose.connection.host.includes('replica') || mongoose.connection.replicaSet;
  const session = isReplicaSet ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  let settledCount = 0;
  try {
    for (const booking of eligibleBookings) {
      if (!booking.turf?.owner) {
        console.warn(chalk.yellow(`[SETTLEMENT] Booking ${booking._id}: no owner — skipping.`));
        continue;
      }

      const ownerRevenue = booking.ownerRevenue || booking.totalPrice;
      const owner = booking.turf.owner;
      const walletUserId = owner.userId || owner._id;

      await Owner.findByIdAndUpdate(
        owner._id,
        {
          $inc: {
            inProgressBalance: -ownerRevenue,
            walletBalance: ownerRevenue,
          },
        },
        { session }
      );

      await WalletTransaction.create(
        [
          {
            user: walletUserId,
            amount: ownerRevenue,
            type: "SETTLEMENT",
            status: "SUCCESS",
            description: `Auto-settled: booking #${booking._id.toString().slice(-6).toUpperCase()} at ${booking.turf?.name || "Ground"}`,
            bookingId: booking._id,
          },
        ],
        { session }
      );

      await Booking.findByIdAndUpdate(
        booking._id,
        {
          $set: {
            status: "COMPLETED",
            revenueStatus: "SETTLED",
            settledAt: now,
          },
        },
        { session }
      );

      settledCount++;
    }

    if (session) await session.commitTransaction();
    if (settledCount > 0) {
      console.log(
        chalk.green(`[SETTLEMENT] Phase B: Auto-settled ${settledCount} booking(s) ✓`)
      );
    }
  } catch (err) {
    if (session) await session.abortTransaction();
    console.error(chalk.red("[SETTLEMENT] Phase B error:"), err.message);
  } finally {
    if (session) session.endSession();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Legacy compatibility shim
// Handles any remaining bookings that were settled under the old 12-hour
// PENDING→CONFIRMED flow (revenueStatus: "PENDING", status: "CONFIRMED"/"COMPLETED")
// but still have no playStartTime set (pre-migration bookings).
// Can be removed once all old bookings are settled.
// ─────────────────────────────────────────────────────────────────────────────
const runLegacySettlement = async () => {
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

  const legacyBookings = await Booking.find({
    revenueStatus: "PENDING",
    status: { $in: ["CONFIRMED", "COMPLETED"] },
    playStartTime: { $exists: false },
  })
    .populate("timeSlot")
    .populate({ path: "turf", populate: { path: "owner", select: "_id userId" } })
    .lean();

  if (legacyBookings.length === 0) return;

  const session = await mongoose.startSession();
  session.startTransaction();
  let legacyCount = 0;

  try {
    for (const booking of legacyBookings) {
      if (!booking.timeSlot?.endTime || !booking.turf?.owner) continue;
      if (new Date(booking.timeSlot.endTime) > twelveHoursAgo) continue;

      const amount = booking.ownerRevenue || booking.totalPrice;
      const owner = booking.turf.owner;
      const walletUserId = owner.userId || owner._id;

      await Owner.findByIdAndUpdate(
        owner._id,
        { $inc: { pendingBalance: -amount, walletBalance: amount } },
        { session }
      );

      await WalletTransaction.create(
        [
          {
            user: walletUserId,
            amount,
            type: "SETTLEMENT",
            status: "SUCCESS",
            description: `Legacy settlement: booking #${booking._id.toString().slice(-6).toUpperCase()}`,
            bookingId: booking._id,
          },
        ],
        { session }
      );

      await Booking.findByIdAndUpdate(
        booking._id,
        {
          $set: {
            status: "COMPLETED",
            revenueStatus: "SETTLED",
            settledAt: new Date(),
          },
        },
        { session }
      );

      legacyCount++;
    }

    await session.commitTransaction();
    if (legacyCount > 0) {
      console.log(chalk.cyan(`[SETTLEMENT] Legacy: settled ${legacyCount} old booking(s) ✓`));
    }
  } catch (err) {
    await session.abortTransaction();
    console.error(chalk.red("[SETTLEMENT] Legacy settlement error:"), err.message);
  } finally {
    session.endSession();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Entry point — called from server.js after DB connects
// ─────────────────────────────────────────────────────────────────────────────
export const initSettlementWorker = () => {
  console.log(chalk.magenta("[SETTLEMENT] Initializing settlement worker..."));

  // One-time backfill for pre-migration bookings
  backfillPlayTimes();

  // Run all jobs immediately on startup
  runPlayingTransition();
  runAutoSettle();
  runLegacySettlement();

  // Phase A: CONFIRMED → PLAYING → IN_REVIEW_WINDOW  (every 5 min)
  // Phase B: IN_REVIEW_WINDOW → COMPLETED  (every 15 min)
  // Legacy: old 12-hr PENDING→SETTLED flow  (every 60 min)
  // NOTE: Recurring scheduling is handled by BullMQ (server/queues/settlement.queue.js).
  //       setInterval calls have been removed to prevent duplicate execution across
  //       multiple server instances.

  console.log(chalk.magenta('[SETTLEMENT] Worker functions ready. Scheduling handled by BullMQ.'));
};
