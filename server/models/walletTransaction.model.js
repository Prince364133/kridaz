import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },

    // ── Transaction type ──────────────────────────────────────────────────────
    // TOPUP            : User added money to their wallet via Razorpay
    // DEBIT            : Money spent from wallet (e.g. booking, game join)
    // REFUND           : Money returned to user (e.g. dispute resolved in user's favour)
    // OFFER            : Promotional / cashback credit
    // HOST_GAME        : Revenue from hosting a game
    // JOIN_GAME        : Fee deducted for joining a hosted game
    // REVENUE          : Generic owner revenue entry (legacy — prefer SETTLEMENT)
    // WITHDRAWAL       : Owner requested a payout withdrawal
    // SETTLEMENT       : Auto-settled booking revenue moved to owner.walletBalance
    // DISPUTE_FREEZE   : Funds locked into owner.disputeBalance on dispute creation
    // DISPUTE_RELEASE  : Frozen funds released back to owner.walletBalance after admin approval
    type: {
      type: String,
      enum: [
        "TOPUP",
        "DEBIT",
        "REFUND",
        "OFFER",
        "HOST_GAME",
        "JOIN_GAME",
        "REVENUE",
        "WITHDRAWAL",
        "SETTLEMENT",
        "DISPUTE_FREEZE",
        "DISPUTE_RELEASE",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "RESERVED"],
      default: "PENDING",
    },
    description: { type: String },
    razorpayOrderId:   { type: String },
    razorpayPaymentId: { type: String },

    // References for traceability
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    disputeId: { type: mongoose.Schema.Types.ObjectId, ref: "Dispute" },
  },
  { timestamps: true }
);

// ── Performance indexes ───────────────────────────────────────────────────────
walletTransactionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("WalletTransaction", walletTransactionSchema);

