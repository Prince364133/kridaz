import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      user: { type: mongoose.Schema.Types.ObjectId, refPath: "sender.onModel" },
      onModel: { type: String, enum: ["User", "Owner"] }
    },
    content: { type: String, trim: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, refPath: "readBy.onModel" },
        onModel: { type: String, enum: ["User", "Owner"] }
      }
    ],
    deletedBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, refPath: "deletedBy.onModel" },
        onModel: { type: String, enum: ["User", "Owner"] }
      }
    ],
    media: [
      {
        url: { type: String },
        type: { type: String, enum: ["image", "video", "file"] }
      }
    ],
    isStarred: { type: Boolean, default: false },
    isForwarded: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// ── Performance indexes ───────────────────────────────────────────────────────
messageSchema.index({ chat: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
