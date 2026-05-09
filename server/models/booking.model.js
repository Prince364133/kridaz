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
    revenueStatus: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED"],
      default: "PENDING"
    },
    bookingSource: { 
      type: String, 
      enum: ["USER", "PARTNER_MANUAL"], 
      default: "USER" 
    },
    paymentMethod: { 
      type: String, 
      enum: ["ONLINE", "WALLET", "CASH", "UPI", "CARD", "NETBANKING"], 
      default: "ONLINE" 
    },
    cashback: { type: Number, default: 0 },
    advanceAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    paymentType: { 
      type: String, 
      enum: ["PARTIAL", "FULL"], 
      default: "FULL" 
    },
    platformFee: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    ownerRevenue: { type: Number, default: 0 },
    guestDetails: {
      name: String,
      phone: String,
      email: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
