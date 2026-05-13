import mongoose from "mongoose";

const ownerRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    role: { type: String, enum: ["owner", "venue_owner", "coach", "umpire", "streamer"], default: "owner" },
    businessDetails: {
      businessName: String,
      registrationNumber: String,
      address: String,
      city: String,
      state: String,
      zipCode: String,
      experience: String, // For coaches/umpires
      specialization: String, // For coaches/umpires
    },
    documents: [
      {
        name: String,
        url: String,
      },
    ],
    portfolioUrl: String,
    rejectionReason: String,
  },
  { timestamps: true }
);

export default mongoose.model("OwnerRequest", ownerRequestSchema);