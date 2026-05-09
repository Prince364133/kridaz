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
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
      bankName: { type: String, required: true },
    },
    transactionId: { type: String }, // Provided by admin when manually transferring funds
    rejectionReason: { type: String },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
