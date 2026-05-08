import mongoose from "mongoose";

const ownerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String },
    googleId: { type: String },
    phone: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Other", "Prefer not to say"] },
    location: { type: String },
    profilePicture: { type: String },
    role: { type: String, enum: ["admin", "owner", "coach", "umpire", "BMSP_ADMIN", "VERIFIED_VENUE_OWNER", "BMSP_OWNER"], default: "owner" },
    businessDetails: {
      businessName: String,
      registrationNumber: String,
      address: String,
      city: String,
      state: String,
      zipCode: String,
      experience: String,
      specialization: String,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, refPath: "role" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, refPath: "role" }],
    bookingCount: { type: Number, default: 0 },
    interests: [{ type: String }],
    waitlistPosition: { type: Number },
    price: { type: Number, default: 0 },
    gameTypes: [{ type: String }],
    city: { type: String },
    state: { type: String },
    walletBalance: { type: Number, default: 0 },
    reservedBalance: { type: Number, default: 0 },
    certifications: [{ type: String }],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
 },
 { timestamps: true }
);

export default mongoose.model("Owner", ownerSchema);
