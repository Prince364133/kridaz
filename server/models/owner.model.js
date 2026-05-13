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
    bio: { type: String },
    role: { type: String, enum: ["admin", "owner", "coach", "umpire", "streamer", "scorer", "LIMITED_UMPIRE", "LIMITED_SCORER", "BMSP_ADMIN", "VERIFIED_VENUE_OWNER", "BMSP_OWNER"], default: "owner" },
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
    pendingBalance: { type: Number, default: 0 },

    // ── Revenue settlement buckets ────────────────────────────────────────────
    // inProgressBalance  : Booking played, currently inside 2-hr review window.
    //                      Moved from pendingBalance by cron when slot ends.
    //                      Moved to walletBalance on auto-settle (no dispute).
    // disputeBalance     : Funds frozen because customer raised a dispute.
    //                      Admin resolution either releases to walletBalance
    //                      or triggers a customer refund.
    // withdrawnBalance   : Cumulative total of approved withdrawal payouts.
    //                      Read-only accounting field — never decremented.
    inProgressBalance: { type: Number, default: 0 },
    disputeBalance:    { type: Number, default: 0 },
    withdrawnBalance:  { type: Number, default: 0 },
    certifications: [{ type: String }],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
    bankingDetails: {
      accountName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      upiId: String,
      cancelledCheckUrl: String,
      kycStatus: { 
        type: String, 
        enum: ["NOT_SUBMITTED", "PENDING", "VERIFIED", "REJECTED"], 
        default: "NOT_SUBMITTED" 
      },
      payoutMode: { type: String, enum: ["BANK", "UPI"], default: "BANK" }
    },
    approvalDetails: {
      adminName: String,
      adminDesignation: String,
      approvedAt: Date
    },
    verificationDocuments: [
      {
        name: String,
        url: String,
      },
    ],
    upgradeRequested: { type: Boolean, default: false },
 },
 { timestamps: true }
);

ownerSchema.index({ userId: 1 });

export default mongoose.model("Owner", ownerSchema);
