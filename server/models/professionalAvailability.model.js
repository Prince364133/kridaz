import mongoose from "mongoose";

const professionalAvailabilitySchema = new mongoose.Schema(
  {
    professionalId: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    slots: [
      {
        startTime: { type: String, required: true }, // Format: HH:mm
        endTime: { type: String, required: true }, // Format: HH:mm
        isAvailable: { type: Boolean, default: true },
        bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "ProfessionalBooking" },
      },
    ],
  },
  { timestamps: true }
);

professionalAvailabilitySchema.index({ professionalId: 1, date: 1 }, { unique: true });

export default mongoose.model("ProfessionalAvailability", professionalAvailabilitySchema);
