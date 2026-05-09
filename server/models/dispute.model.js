import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, refPath: "onModel", required: true },
    onModel: { type: String, required: true, enum: ["User", "Owner"] },
    reason: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "INVESTIGATING", "RESOLVED", "CANCELLED"],
      default: "PENDING",
    },
    resolution: {
      action: { type: String, enum: ["REFUND", "PAYOUT", "NO_ACTION", "PARTIAL_REFUND"] },
      message: String,
      resolvedAt: Date,
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Dispute", disputeSchema);
