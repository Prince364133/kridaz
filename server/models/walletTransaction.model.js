import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["TOPUP", "DEBIT", "REFUND", "OFFER", "HOST_GAME", "JOIN_GAME", "REVENUE", "WITHDRAWAL"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "RESERVED"],
      default: "PENDING",
    },
    description: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  },
  { timestamps: true }
);

export default mongoose.model("WalletTransaction", walletTransactionSchema);
