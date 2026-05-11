import Message from "../../models/message.model.js";
import Chat from "../../models/chat.model.js";
import User from "../../models/user.model.js";

// Helper: resolve the correct user ID and model for the current request
function resolveCurrentUser(req) {
  const isOwner = req.user?.role === "owner" || req.owner?.role === "owner";
  const currentUserId = isOwner
    ? (req.user?.ownerId || req.owner?.ownerId || req.user?.id || req.owner?.id)
    : (req.user?.id || req.owner?.id);
  const currentUserModel = isOwner ? "Owner" : "User";
  return { currentUserId, currentUserModel, isOwner };
}

/**
 * Get all messages for a specific chat
 */
export const allMessages = async (req, res) => {
  try {
    const { currentUserId } = resolveCurrentUser(req);
    const messages = await Message.find({ 
      chat: req.params.chatId,
      "deletedBy.user": { $ne: currentUserId }
    })
      .populate("sender.user", "name profilePicture profileImage email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Send a new message
 */
export const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  // For Owners, use the Owner doc _id so populate works correctly with "Owner" model
  const isOwner = req.user?.role === "owner" || req.owner?.role === "owner";
  const currentUserId = isOwner
    ? (req.user?.ownerId || req.owner?.ownerId || req.user?.id || req.owner?.id)
    : (req.user?.id || req.owner?.id);
  const currentUserModel = isOwner ? "Owner" : "User";

  var newMessage = {
    sender: { user: currentUserId, onModel: currentUserModel },
    content: content,
    chat: chatId,
    readBy: [{ user: currentUserId, onModel: currentUserModel }],
  };

  try {
    const chat = await Chat.findById(chatId);
    if (chat && chat.adminOnlyMessages) {
      const isAdmin = chat.groupAdmin?.user?.toString() === currentUserId.toString() || 
                      chat.groupAdmin?.toString() === currentUserId.toString();
      if (!isAdmin) {
        return res.status(403).json({ message: "Only admins can send messages in this group" });
      }
    }

    var message = await Message.create(newMessage);

    message = await message.populate("sender.user", "name profilePicture profileImage");
    message = await message.populate("chat");
    message = await Message.populate(message, {
      path: "chat.users.user",
      select: "name profilePicture profileImage email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Mark messages as read
 */
export const markMessagesRead = async (req, res) => {
  const { chatId } = req.params;
  const isOwner = req.user?.role === "owner" || req.owner?.role === "owner";
  const currentUserId = isOwner
    ? (req.user?.ownerId || req.owner?.ownerId || req.user?.id || req.owner?.id)
    : (req.user?.id || req.owner?.id);
  const currentUserModel = isOwner ? "Owner" : "User";

  try {
    await Message.updateMany(
      {
        chat: chatId,
        "readBy.user": { $ne: currentUserId },
      },
      {
        $addToSet: { readBy: { user: currentUserId, onModel: currentUserModel } },
      }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Delete multiple messages
 */
export const deleteMessages = async (req, res) => {
  const { messageIds, chatId, deleteType } = req.body; // deleteType: "me" or "everyone"

  if (!messageIds || !Array.isArray(messageIds)) {
    return res.status(400).json({ message: "Invalid message IDs" });
  }

  const { currentUserId, currentUserModel } = resolveCurrentUser(req);

  try {
    if (deleteType === "everyone") {
      // Only allow deleting "for everyone" if you are the sender or group admin (simplified: anyone for now as per previous logic)
      await Message.deleteMany({ _id: { $in: messageIds } });
    } else {
      // Delete for me: add current user to deletedBy array
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $addToSet: { deletedBy: { user: currentUserId, onModel: currentUserModel } } }
      );
    }

    // If a chatId is provided, update the latestMessage
    if (chatId) {
      const latestRemaining = await Message.findOne({ 
        chat: chatId,
        "deletedBy.user": { $ne: currentUserId } 
      }).sort({ createdAt: -1 });
      await Chat.findByIdAndUpdate(chatId, { latestMessage: latestRemaining || null });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
