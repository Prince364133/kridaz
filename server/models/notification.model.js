import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true,
      refPath: 'recipientModel'
    },
    recipientModel: {
      type: String,
      required: true,
      enum: ['User', 'Owner']
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['BOOKING', 'PAYMENT', 'REVIEW', 'SUPPORT', 'WITHDRAWAL', 'SYSTEM'],
      required: true 
    },
    link: { type: String }, // For navigation
    isRead: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed } // For any extra data
  },
  { timestamps: true }
);

// ── Performance indexes ───────────────────────────────────────────────────────
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// TTL: auto-delete notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });

export default mongoose.model("Notification", notificationSchema);
