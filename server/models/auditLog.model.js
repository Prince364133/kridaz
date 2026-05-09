import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // e.g., "APPROVE_WITHDRAWAL", "REJECT_OWNER"
    module: { type: String, required: true }, // e.g., "FINANCE", "USER_MANAGEMENT"
    targetId: { type: mongoose.Schema.Types.ObjectId }, // ID of the affected resource
    details: { type: mongoose.Schema.Types.Mixed }, // Any additional metadata
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);
