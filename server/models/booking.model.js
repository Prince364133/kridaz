import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    turf: { type: mongoose.Schema.Types.ObjectId, ref: "Turf" },
    timeSlot: { type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot" },
    totalPrice: { type: Number, required: true },
    qrCode: { type: String, required: true },
    payment: {
      orderId: { type: String, required: true },
      paymentId: { type: String, required: true },
    },
    status: { 
      type: String, 
      enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"], 
      default: "CONFIRMED" 
    },
    bookingSource: { 
      type: String, 
      enum: ["USER", "PARTNER_MANUAL"], 
      default: "USER" 
    },
    paymentMethod: { 
      type: String, 
      enum: ["ONLINE", "WALLET", "CASH"], 
      default: "ONLINE" 
    },
    guestDetails: {
      name: String,
      phone: String,
      email: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
