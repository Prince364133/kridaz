import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    chatName: { type: String, trim: true },
    isGroupChat: { type: Boolean, default: false },
    isCommunity: { type: Boolean, default: false },
    description: { type: String, trim: true },
    parentCommunity: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    isAnnouncementGroup: { type: Boolean, default: false },
    adminOnlyMessages: { type: Boolean, default: false },
    users: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, refPath: "users.onModel" },
        onModel: { type: String, enum: ["User", "Owner"] }
      }
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    },
    groupAdmin: {
      user: { type: mongoose.Schema.Types.ObjectId, refPath: "groupAdmin.onModel" },
      onModel: { type: String, enum: ["User", "Owner"] }
    },
    pendingMembers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, refPath: "pendingMembers.onModel" },
        onModel: { type: String, enum: ["User", "Owner"] }
      }
    ]
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
