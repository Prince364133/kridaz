import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
  {
    // ── Core references ───────────────────────────────────────────────────────
    booking:   { type: mongoose.Schema.Types.ObjectId, ref: "Booking",  required: true },
    raisedBy:  { type: mongoose.Schema.Types.ObjectId, refPath: "onModel", required: true },
    onModel:   { type: String, required: true, enum: ["User", "Owner"] },

    // ── Dispute content ───────────────────────────────────────────────────────
    reason: {
      type: String,
      required: true,
      // Predefined categories shown in the UI selection step
      enum: [
        "VENUE_CLOSED",
        "OVERBOOKING",
        "QUALITY_ISSUE",
        "NO_ACCESS",
        "SAFETY_CONCERN",
        "OTHER",
      ],
    },
    description: { type: String, required: true, minlength: 50 },
    images: [{ type: String }], // Cloudinary URLs, up to 5

    // ── Lifecycle status ──────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["PENDING", "INVESTIGATING", "RESOLVED", "CLOSED"],
      default: "PENDING",
    },

    // ── Resolution details (filled by admin) ─────────────────────────────────
    resolution: {
      action: {
        type: String,
        enum: ["APPROVE_PAYOUT", "REFUND_CUSTOMER", "PARTIAL_REFUND", "NO_ACTION"],
      },
      partialAmount: { type: Number },  // Used when action = PARTIAL_REFUND
      adminNote:     { type: String },
      resolvedAt:    { type: Date },
      resolvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    },

    // ── Chat thread ───────────────────────────────────────────────────────────
    // Each entry is one message in the dispute conversation.
    // Mirrors the SupportTicket.replies pattern so the same UI component works.
    replies: [
      {
        sender:    { type: String, enum: ["ADMIN", "USER"], required: true },
        senderId:  { type: mongoose.Schema.Types.ObjectId }, // for avatar / linking
        message:   { type: String },
        images:    [{ type: String }], // inline image attachments in a reply
        createdAt: { type: Date, default: Date.now },
      },
    ],
    lastRepliedAt: { type: Date, default: Date.now },

    // ── Denormalized booking snapshot ─────────────────────────────────────────
    // Stored at dispute-creation time so admin can read all key facts even if
    // the underlying booking/turf records are later modified.
    bookingDetails: {
      turfName:    { type: String },
      ownerName:   { type: String },
      ownerPhone:  { type: String },
      playDate:    { type: Date },   // The slot's startTime
      slotLabel:   { type: String }, // e.g. "7:00 PM – 8:00 PM"
      totalAmount: { type: Number },
      ownerRevenue:{ type: Number },
    },
  },
  { timestamps: true }
);

// Speed up admin list queries (most common filter)
disputeSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Dispute", disputeSchema);

