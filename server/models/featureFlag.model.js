import mongoose from "mongoose";

const featureFlagSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

const FeatureFlag = mongoose.model("FeatureFlag", featureFlagSchema);

export default FeatureFlag;
