import Chat from "../../models/chat.model.js";
import mongoose from "mongoose";
import User from "../../models/user.model.js";
import Owner from "../../models/owner.model.js";
import Message from "../../models/message.model.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";
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
 * Access or create a one-on-one chat
 */
export const accessChat = async (req, res) => {
  const { userId, onModel } = req.body;
  const { currentUserId, currentUserModel } = resolveCurrentUser(req);

  if (!userId) return res.sendStatus(400);

  // Find existing 1-on-1 chat
  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { user: currentUserId } } },
      { users: { $elemMatch: { user: userId } } },
    ],
  })
    .populate("users.user", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender.user",
    select: "name pic email",
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    // Create new 1-on-1 chat
    const chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [
        { user: currentUserId, onModel: currentUserModel },
        { user: userId, onModel: onModel || "User" },
      ],
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users.user",
        "-password"
      );
      res.status(200).json(FullChat);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

/**
 * Fetch all chats for the current user
 */
export const fetchChats = async (req, res) => {
  const { currentUserId } = resolveCurrentUser(req);

  try {
    const chats = await Chat.find({
      $or: [
        { users: { $elemMatch: { user: currentUserId } } },
        { pendingMembers: { $elemMatch: { user: currentUserId } } }
      ]
    })
      .populate("users.user", "-password")
      .populate("groupAdmins.user", "-password")
      .populate("pendingMembers.user", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    const results = await User.populate(chats, {
      path: "latestMessage.sender.user",
      select: "name pic email",
    });

    // Separate active chats and invitations
    const invitations = results.filter(chat => 
      chat.pendingMembers.some(m => m.user?._id?.toString() === currentUserId.toString()) &&
      !chat.users.some(m => m.user?._id?.toString() === currentUserId.toString())
    );
    
    const activeChats = results.filter(chat => 
      chat.users.some(m => m.user?._id?.toString() === currentUserId.toString())
    );

    res.status(200).send({ chats: activeChats, invitations });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Create a group chat
 */
export const createGroupChat = async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please fill all the fields" });
  }

  const { currentUserId, currentUserModel } = resolveCurrentUser(req);

  let userIds = [];
  try {
    userIds = JSON.parse(req.body.users); // Array of IDs from frontend
  } catch(e) {
    return res.status(400).send({ message: "Invalid users format" });
  }

  const { isCommunity, description, parentCommunity } = req.body;

  if (!isCommunity && !parentCommunity && (!Array.isArray(userIds) || userIds.length < 2)) {
    return res
      .status(400)
      .send({ message: "More than 2 users are required to form a group chat" });
  }

  try {
    // Resolve onModel for each invited user
    const usersWithModel = await Promise.all(userIds.map(async (id) => {
      const isUser = await User.exists({ _id: id });
      return { user: id, onModel: isUser ? "User" : "Owner" };
    }));

    // Add current user as admin and verified member
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: [{ user: currentUserId, onModel: currentUserModel }],
      isGroupChat: true,
      isCommunity: !!isCommunity,
      description: description || "",
      parentCommunity: parentCommunity || null,
      groupAdmins: [{ user: currentUserId, onModel: currentUserModel }],
      pendingMembers: usersWithModel
    });

    // If it's a community, create an Announcements group automatically
    if (isCommunity) {
      await Chat.create({
        chatName: "Announcements",
        users: [{ user: currentUserId, onModel: currentUserModel }],
        isGroupChat: true,
        isCommunity: false,
        parentCommunity: groupChat._id,
        isAnnouncementGroup: true,
        adminOnlyMessages: true,
        groupAdmins: [{ user: currentUserId, onModel: currentUserModel }],
        description: `Announcements for ${req.body.name}`
      });
    }

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users.user", "-password")
      .populate("groupAdmins.user", "-password")
      .populate("pendingMembers.user", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Respond to group invite
 */
export const respondToInvite = async (req, res) => {
  const { chatId, status } = req.body; // status: 'accepted' or 'rejected'
  const { currentUserId, currentUserModel } = resolveCurrentUser(req);

  try {
    if (status === "accepted") {
      const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        {
          $pull: { pendingMembers: { user: currentUserId } },
          $addToSet: { users: { user: currentUserId, onModel: currentUserModel } },
        },
        { new: true }
      )
        .populate("users.user", "-password")
        .populate("groupAdmins.user", "-password");

      res.status(200).json(updatedChat);
    } else {
      // Rejected: Just remove from pending
      const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        { $pull: { pendingMembers: { user: currentUserId } } },
        { new: true }
      );
      res.status(200).json(updatedChat);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



/**
 * Update group info (name, description, etc)
 */
export const updateGroup = async (req, res) => {
  const { chatId, chatName, description } = req.body;
    const { currentUserId, allUserIds } = resolveCurrentUser(req);

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Verify admin
    if (!checkIsAdmin(chat, allUserIds)) {
      return res.status(403).json({ message: "Only admins can update group info" });
    }

    const updateData = {};
    if (chatName) updateData.chatName = chatName;
    if (description !== undefined) updateData.description = description;

    // Handle Image Upload
    if (req.file) {
      try {
        const imageUrl = await uploadToCloudinary(req.file.buffer, "groups");
        updateData.groupImage = imageUrl;
      } catch (err) {
        console.error("Cloudinary upload failed:", err);
      }
    } else if (req.body.groupImage) {
      updateData.groupImage = req.body.groupImage;
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      updateData,
      { new: true }
    )
      .populate("users.user", "-password")
      .populate("groupAdmins.user", "-password")
      .populate("pendingMembers.user", "-password");

    // Real-time update for all participants
    const io = getIO();
    if (io) {
      updatedChat.users.forEach(u => {
        const uid = (u.user?._id || u.user)?.toString();
        io.to(uid).emit("chat updated", updatedChat);
      });
    }

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Add user to group
 */
export const addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    // Need to resolve onModel for the invited user
    const isUser = await User.exists({ _id: userId });
    const userModel = isUser ? "User" : "Owner";

    const added = await Chat.findByIdAndUpdate(
      chatId,
      {
        $addToSet: { pendingMembers: { user: userId, onModel: userModel } },
      },
      { new: true }
    )
      .populate("users.user", "-password")
      .populate("groupAdmins.user", "-password")
      .populate("pendingMembers.user", "-password");

    if (!added) {
      res.status(404);
      throw new Error("Chat Not Found");
    } else {
      res.json(added);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Remove user from group / Leave group
 */
export const removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    const removed = await Chat.findByIdAndUpdate(
      chatId,
      {
        $pull: { 
          users: { user: new mongoose.Types.ObjectId(userId) }, 
          pendingMembers: { user: new mongoose.Types.ObjectId(userId) } 
        },
      },
      { new: true }
    )
      .populate("users.user", "-password")
      .populate("groupAdmins.user", "-password")
      .populate("pendingMembers.user", "-password");

    if (!removed) {
      res.status(404);
      throw new Error("Chat Not Found");
    }

    // Cascading Exit for Communities
    if (removed.isCommunity) {
      await Chat.updateMany(
        { parentCommunity: chatId },
        { 
          $pull: { 
            users: { user: new mongoose.Types.ObjectId(userId) }, 
            pendingMembers: { user: new mongoose.Types.ObjectId(userId) } 
          } 
        }
      );
    }

    // Real-time update for all participants
    const io = getIO();
    if (io) {
      removed.users.forEach(u => {
        const uid = (u.user?._id || u.user)?.toString();
        io.to(uid).emit("chat updated", removed);
      });
      // Also tell the user who left that the chat is deleted for them
      io.to(userId.toString()).emit("chat deleted", chatId);
    }

    res.json(removed);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Delete Chat / Community
 */
export const deleteChat = async (req, res) => {
  const { chatId } = req.params;
  const { currentUserId, allUserIds } = resolveCurrentUser(req);

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Remove the admin restriction to allow anyone to delete the group/community
    // For 1-on-1 chats, still verify the user is a participant
    if (!chat.isGroupChat) {
      const isParticipant = chat.users.some(u => {
        const uid = (u.user?._id || u.user)?.toString();
        return allUserIds.includes(uid);
      });
      if (!isParticipant) {
        return res.status(403).json({ message: "You are not a participant of this chat" });
      }
    }

    // Keep track of users to notify them
    const participantIds = chat.users.map(u => (u.user?._id || u.user)?.toString());
    const io = getIO();

    // Cascading Delete for Communities
    if (chat.isCommunity) {
      const childGroups = await Chat.find({ parentCommunity: chatId }).select('_id users');
      const childIds = childGroups.map(g => g._id);
      await Message.deleteMany({ chat: { $in: childIds } });
      await Chat.deleteMany({ parentCommunity: chatId });

      if (io) {
        childGroups.forEach(g => {
          g.users.forEach(u => {
             const uid = (u.user?._id || u.user)?.toString();
             io.to(uid).emit("chat deleted", g._id);
          });
        });
      }
    }

    // Delete messages associated with this chat
    await Message.deleteMany({ chat: chatId });
    await Chat.findByIdAndDelete(chatId);

    if (io) {
      participantIds.forEach(uid => {
        io.to(uid).emit("chat deleted", chatId);
      });
    }

    res.status(200).json({ message: "Chat deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Add existing groups to a community
 */
export const addGroupsToCommunity = async (req, res) => {
  const { communityId, groupIds } = req.body;
  const { allUserIds } = resolveCurrentUser(req);

  try {
    const community = await Chat.findById(communityId);
    if (!community || !community.isCommunity) {
      return res.status(404).json({ message: "Community not found" });
    }

    if (!checkIsAdmin(community, allUserIds)) {
      return res.status(403).json({ message: "Only admins can add groups to this community" });
    }

    // Update all selected groups to have this parentCommunity
    await Chat.updateMany(
      { _id: { $in: groupIds } },
      { $set: { parentCommunity: communityId } }
    );

    res.status(200).json({ message: "Groups added successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Make a user group admin
 */
export const makeGroupAdmin = async (req, res) => {
  const { chatId, userId } = req.body;
  const { allUserIds } = resolveCurrentUser(req);

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Verify current user is admin
    if (!checkIsAdmin(chat, allUserIds)) {
      return res.status(403).json({ message: "Only admins can promote others to admin" });
    }

    // Check if user is part of the chat
    const isUserInChat = chat.users.find(u => (u.user?._id || u.user)?.toString() === userId?.toString());
    if (!isUserInChat) {
      return res.status(400).json({ message: "User is not a member of this chat" });
    }

    // Add to groupAdmins if not already there
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $addToSet: { groupAdmins: { user: userId, onModel: isUserInChat.onModel } }
      },
      { new: true }
    )
      .populate("users.user", "-password")
      .populate("groupAdmins.user", "-password")
      .populate("pendingMembers.user", "-password");

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Dismiss a user from group admin
 */
export const dismissGroupAdmin = async (req, res) => {
  const { chatId, userId } = req.body;
  const { allUserIds } = resolveCurrentUser(req);

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Verify current user is admin
    if (!checkIsAdmin(chat, allUserIds)) {
      return res.status(403).json({ message: "Only admins can dismiss others from admin" });
    }

    // Check if user to be dismissed is the only admin
    if (chat.groupAdmins.length <= 1 && (chat.groupAdmins[0].user?._id || chat.groupAdmins[0].user)?.toString() === userId?.toString()) {
      return res.status(400).json({ message: "Cannot dismiss the only admin" });
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        $pull: { groupAdmins: { user: new mongoose.Types.ObjectId(userId) } }
      },
      { new: true }
    )
      .populate("users.user", "-password")
      .populate("groupAdmins.user", "-password")
      .populate("pendingMembers.user", "-password");

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Toggle Pin Chat
 */
export const togglePinChat = async (req, res) => {
  const { chatId } = req.body;
  const { currentUserId } = resolveCurrentUser(req);

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Safely compare objectIds to strings
    const isPinned = chat.pinnedBy && chat.pinnedBy.some(id => id.toString() === currentUserId.toString());

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      isPinned
        ? { $pull: { pinnedBy: currentUserId } }
        : { $addToSet: { pinnedBy: currentUserId } },
      { new: true }
    )
      .populate("users.user", "-password")
      .populate("groupAdmins.user", "-password")
      .populate("pendingMembers.user", "-password");

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
