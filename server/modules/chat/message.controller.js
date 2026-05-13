import Message from "../../models/message.model.js";
import Chat from "../../models/chat.model.js";
import User from "../../models/user.model.js";
import { getIO } from "../../config/socket.js";

// Helper: resolve the correct user IDs and model for the current request
function resolveCurrentUser(req) {
  const isOwner = req.user?.role === "owner" || req.owner?.role === "owner";
  
  // Collect all possible IDs for this user
  const ids = new Set();
  if (req.user?._id) ids.add(req.user._id.toString());
  if (req.user?.id) ids.add(req.user.id.toString());
  if (req.user?.userId) ids.add(req.user.userId.toString());
  if (req.user?.ownerId) ids.add(req.user.ownerId.toString());
  if (req.owner?._id) ids.add(req.owner._id.toString());
  if (req.owner?.id) ids.add(req.owner.id.toString());
  if (req.owner?.ownerId) ids.add(req.owner.ownerId.toString());
  
  const currentUserId = isOwner
    ? (req.user?.ownerId || req.owner?.ownerId || req.user?.id || req.owner?.id)
    : (req.user?._id || req.user?.id || req.user?.userId);
    
  const currentUserModel = isOwner ? "Owner" : "User";
  return { currentUserId, currentUserModel, allUserIds: Array.from(ids) };
}

// Helper: check if a user is an admin in a chat
function checkIsAdmin(chat, userIds) {
  return chat.groupAdmins.some(admin => {
    const adminId = (admin.user?._id || admin.user)?.toString();
    return userIds.includes(adminId);
  });
}

/**
 * Get all messages for a specific chat
 */
export const allMessages = async (req, res) => {
  try {
    const { allUserIds } = resolveCurrentUser(req);
    const messages = await Message.find({ 
      chat: req.params.chatId,
      "deletedBy.user": { $nin: allUserIds }
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
  const { content, chatId, media } = req.body;

  if ((!content && !media) || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  const { currentUserId, currentUserModel, allUserIds } = resolveCurrentUser(req);

  var newMessage = {
    sender: { user: currentUserId, onModel: currentUserModel },
    content: content || "",
    chat: chatId,
    readBy: [{ user: currentUserId, onModel: currentUserModel }],
    media: media || []
  };

  try {
    const chat = await Chat.findById(chatId);
    if (chat && chat.adminOnlyMessages) {
      if (!checkIsAdmin(chat, allUserIds)) {
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
 * Forward a message
 */
export const forwardMessage = async (req, res) => {
  const { messageId, chatIds = [], userIds = [] } = req.body;

  if (!messageId || (chatIds.length === 0 && userIds.length === 0)) {
    return res.status(400).json({ message: "Invalid data passed into request" });
  }

  const { currentUserId, currentUserModel } = resolveCurrentUser(req);

  try {
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Determine target chat IDs by accessing/creating 1-on-1 chats for the userIds
    let finalChatIds = [...chatIds];
    
    for (const userId of userIds) {
      // Find or create 1-on-1 chat
      let isChat = await Chat.find({
        isGroupChat: false,
        $and: [
          { users: { $elemMatch: { user: currentUserId } } },
          { users: { $elemMatch: { user: userId } } },
        ],
      });

      if (isChat.length > 0) {
        finalChatIds.push(isChat[0]._id.toString());
      } else {
        const chatData = {
          chatName: "sender",
          isGroupChat: false,
          users: [
            { user: currentUserId, onModel: currentUserModel },
            { user: userId, onModel: "User" } // Assuming forwarding to users is mostly "User" model
          ],
        };
        const createdChat = await Chat.create(chatData);
        finalChatIds.push(createdChat._id.toString());
      }
    }

    // Deduplicate chat IDs
    finalChatIds = [...new Set(finalChatIds)];
    const forwardedMessages = [];

    for (const chatId of finalChatIds) {
      const newMessageData = {
        sender: { user: currentUserId, onModel: currentUserModel },
        content: originalMessage.content,
        chat: chatId,
        readBy: [{ user: currentUserId, onModel: currentUserModel }],
        media: originalMessage.media || [],
        isForwarded: true
      };

      let message = await Message.create(newMessageData);
      message = await message.populate("sender.user", "name profilePicture profileImage");
      message = await message.populate("chat");
      message = await Message.populate(message, {
        path: "chat.users.user",
        select: "name profilePicture profileImage email",
      });

      await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
      forwardedMessages.push(message);
      
      const io = getIO();
      if (io && message.chat && message.chat.users) {
        message.chat.users.forEach((u) => {
          const uid = (u.user?._id || u.user)?.toString();
          if (uid === currentUserId.toString()) return;
          io.to(uid).emit("message recieved", message);
        });
      }
    }

    res.json(forwardedMessages);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Broadcast a new message to multiple users or chats (e.g., sharing a turf)
 */
export const broadcastMessage = async (req, res) => {
  const { content, media = [], chatIds = [], userIds = [] } = req.body;

  if ((!content && media.length === 0) || (chatIds.length === 0 && userIds.length === 0)) {
    return res.status(400).json({ message: "Invalid data passed into request" });
  }

  const { currentUserId, currentUserModel } = resolveCurrentUser(req);

  try {
    let finalChatIds = [...chatIds];
    
    for (const userId of userIds) {
      let isChat = await Chat.find({
        isGroupChat: false,
        $and: [
          { users: { $elemMatch: { user: currentUserId } } },
          { users: { $elemMatch: { user: userId } } },
        ],
      });

      if (isChat.length > 0) {
        finalChatIds.push(isChat[0]._id.toString());
      } else {
        const chatData = {
          chatName: "sender",
          isGroupChat: false,
          users: [
            { user: currentUserId, onModel: currentUserModel },
            { user: userId, onModel: "User" }
          ],
        };
        const createdChat = await Chat.create(chatData);
        finalChatIds.push(createdChat._id.toString());
      }
    }

    finalChatIds = [...new Set(finalChatIds)];
    const sentMessages = [];

    for (const chatId of finalChatIds) {
      const newMessageData = {
        sender: { user: currentUserId, onModel: currentUserModel },
        content: content,
        chat: chatId,
        readBy: [{ user: currentUserId, onModel: currentUserModel }],
        media: media,
        isForwarded: true // Treated as a shared/forwarded item
      };

      let message = await Message.create(newMessageData);
      message = await message.populate("sender.user", "name profilePicture profileImage");
      message = await message.populate("chat");
      message = await Message.populate(message, {
        path: "chat.users.user",
        select: "name profilePicture profileImage email",
      });

      await Chat.findByIdAndUpdate(chatId, { latestMessage: message });
      sentMessages.push(message);
      
      const io = getIO();
      if (io && message.chat && message.chat.users) {
        message.chat.users.forEach((u) => {
          const uid = (u.user?._id || u.user)?.toString();
          if (uid === currentUserId.toString()) return;
          io.to(uid).emit("message recieved", message);
        });
      }
    }

    res.json(sentMessages);
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
        "deletedBy.user": { $nin: allUserIds } 
      }).sort({ createdAt: -1 });
      await Chat.findByIdAndUpdate(chatId, { latestMessage: latestRemaining || null });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
/**
 * Clear all messages in a chat (for me)
 */
export const clearChat = async (req, res) => {
  const { chatId } = req.body;

  if (!chatId) {
    return res.status(400).json({ message: "Chat ID is required" });
  }

  const { currentUserId, currentUserModel } = resolveCurrentUser(req);

  try {
    // Add current user to deletedBy array for all messages in the chat
    await Message.updateMany(
      { chat: chatId, "deletedBy.user": { $ne: currentUserId } },
      { $addToSet: { deletedBy: { user: currentUserId, onModel: currentUserModel } } }
    );

    // Update latestMessage for the chat for this user
    await Chat.findByIdAndUpdate(chatId, { latestMessage: null });

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
/**
 * Get all media for a specific chat
 */
export const getChatMedia = async (req, res) => {
  try {
    const { allUserIds } = resolveCurrentUser(req);
    const mediaMessages = await Message.find({
      chat: req.params.chatId,
      media: { $exists: true, $not: { $size: 0 } },
      "deletedBy.user": { $nin: allUserIds }
    })
      .sort("-createdAt")
      .select("media createdAt");
    
    const allMedia = mediaMessages.reduce((acc, msg) => {
      const flattened = msg.media.map(m => {
        const obj = m.toObject ? m.toObject() : m;
        return { ...obj, createdAt: msg.createdAt };
      });
      return acc.concat(flattened);
    }, []);

    res.status(200).json(allMedia);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
