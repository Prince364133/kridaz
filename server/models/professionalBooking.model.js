import mongoose from "mongoose";

const professionalBookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    professional: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    slots: [
      {
        startTime: String,
        endTime: String,
      },
    ],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    bookingType: {
      type: String,
      enum: ["HOURLY", "MATCH"],
      default: "HOURLY",
    },
    message: { type: String }, // Optional message from user
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("ProfessionalBooking", professionalBookingSchema);
