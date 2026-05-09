import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // If reported by User
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Owner" }, // If reported by Partner
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
    },
    category: {
      type: String,
      enum: ["BILLING", "TECHNICAL", "BOOKING", "ACCOUNT", "OTHER"],
      default: "OTHER",
    },
    replies: [
      {
        sender: { type: String, enum: ["ADMIN", "USER", "OWNER"] },
        message: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    lastRepliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("SupportTicket", supportTicketSchema);
