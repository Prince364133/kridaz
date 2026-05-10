import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    turf: { type: mongoose.Schema.Types.ObjectId, ref: "Turf" },
    timeSlot: { type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot" },
    totalPrice: { type: Number, required: true },
    qrCode: { type: String, required: true },
    payment: {
      orderId: { type: String, required: true },
      paymentId: { type: String, required: true },
    },

    // ── Booking lifecycle ────────────────────────────────────────────────────
    // CONFIRMED        → Booking paid, slot reserved, play date in the future
    // PLAYING          → Play time has started (slot startTime <= now)
    // IN_REVIEW_WINDOW → Play time ended; 2-hr window for dispute/cancellation
    // COMPLETED        → Review window closed with no dispute → funds released
    // DISPUTED         → Customer raised a dispute within review window
    // CANCELLED        → Cancelled before play time; no refund issued
    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PLAYING",
        "IN_REVIEW_WINDOW",
        "COMPLETED",
        "DISPUTED",
        "CANCELLED",
      ],
      default: "CONFIRMED",
    },

    // ── Revenue / payment settlement status ──────────────────────────────────
    // PENDING    → Not yet settled (booking confirmed but not yet played)
    // IN_PROGRESS → Booking inside 2-hr review window; funds held temporarily
    // SETTLED    → Funds moved to owner's usable balance after window closes
    // FROZEN     → Funds frozen due to an active dispute
    // REFUNDED   → Admin resolved dispute in customer's favour
    revenueStatus: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "SETTLED", "FROZEN", "REFUNDED"],
      default: "PENDING",
    },

    bookingSource: {
      type: String,
      enum: ["USER", "PARTNER_MANUAL"],
      default: "USER",
    },
    paymentMethod: {
      type: String,
      enum: ["ONLINE", "WALLET", "CASH", "UPI", "CARD", "NETBANKING"],
      default: "ONLINE",
    },
    cashback:      { type: Number, default: 0 },
    advanceAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    paymentType: {
      type: String,
      enum: ["PARTIAL", "FULL"],
      default: "FULL",
    },
    platformFee: { type: Number, default: 0 },
    gstAmount:   { type: Number, default: 0 },
    ownerRevenue: { type: Number, default: 0 },
    guestDetails: {
      name:  String,
      phone: String,
      email: String,
    },

    // ── Settlement tracking fields ────────────────────────────────────────────
    // Copied from TimeSlot at booking creation time so the cron job can work
    // without an extra JOIN per booking during every settlement run.
    playStartTime: { type: Date },   // = TimeSlot.startTime (actual play start)
    playEndTime:   { type: Date },   // = TimeSlot.endTime   (actual play end)

    // 2-hour review window: reviewWindowEndsAt = playEndTime + 2h
    // Set by cron when booking transitions to IN_REVIEW_WINDOW.
    reviewWindowEndsAt: { type: Date },

    // Timestamp of when the booking was auto-completed by the cron job
    settledAt: { type: Date },

    // Reference to a Dispute document if the customer raised one
    dispute: { type: mongoose.Schema.Types.ObjectId, ref: "Dispute" },
  },
  { timestamps: true }
);

// Index to speed up the cron job queries
bookingSchema.index({ status: 1, playStartTime: 1 });
bookingSchema.index({ status: 1, reviewWindowEndsAt: 1 });

export default mongoose.model("Booking", bookingSchema);

