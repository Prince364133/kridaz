import mongoose from "mongoose";

const systemSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // e.g., "PAYOUT_CONFIG"
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    description: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("SystemSetting", systemSettingSchema);
