import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REJECTED"],
      default: "PENDING",
    },
    bankDetails: {
      accountName: { type: String, required: true },
      accountNumber: { type: String },
      ifscCode: { type: String },
      bankName: { type: String },
      upiId: { type: String },
      payoutMode: { type: String, enum: ["BANK", "UPI"], default: "BANK" }
    },
    transactionId: { type: String }, // Provided by admin when manually transferring funds
    rejectionReason: { type: String },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
