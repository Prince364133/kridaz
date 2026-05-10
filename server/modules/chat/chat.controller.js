import Chat from "../../models/chat.model.js";
import User from "../../models/user.model.js";
import Owner from "../../models/owner.model.js";
import Message from "../../models/message.model.js";

/**
 * Access or create a 1-on-1 chat
 */
export const accessChat = async (req, res) => {
  const { userId, onModel } = req.body; // target user id and their model type

  if (!userId) {
    return res.status(400).json({ message: "UserId param not sent with request" });
  }

  // Current logged in user info
  const currentUserId = req.user?.id || req.owner?.id;
  const currentUserModel = req.user ? "User" : "Owner";

  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { user: currentUserId, onModel: currentUserModel } } },
      { users: { $elemMatch: { user: userId, onModel: onModel || "User" } } }
    ]
  })
    .populate("users.user", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender.user",
    select: "name profilePicture email"
  });

  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [
        { user: currentUserId, onModel: currentUserModel },
        { user: userId, onModel: onModel || "User" }
      ]
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users.user",
        "-password"
      );
      res.status(200).send(FullChat);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
};

/**
 * Fetch all chats for a user
 */
export const fetchChats = async (req, res) => {
  try {
    const currentUserId = req.user?.id || req.owner?.id;
    const currentUserModel = req.user ? "User" : "Owner";

    const results = await Chat.find({
      $or: [
        { users: { $elemMatch: { user: currentUserId, onModel: currentUserModel } } },
        { pendingMembers: { $elemMatch: { user: currentUserId, onModel: currentUserModel } } }
      ]
    })
      .populate("users.user", "-password")
      .populate("groupAdmin.user", "-password")
      .populate("pendingMembers.user", "-password")
      .populate({
        path: "latestMessage",
        populate: {
          path: "sender.user",
          select: "name profilePicture email"
        }
      })
      .sort({ updatedAt: -1 });

    // Separate active chats from invitations
    const invitations = results.filter(chat => 
      chat.pendingMembers.some(m => m.user?._id?.toString() === currentUserId.toString() || m.user?.toString() === currentUserId.toString())
    );

    const chats = results.filter(chat => 
      chat.users.some(m => m.user?._id?.toString() === currentUserId.toString() || m.user?.toString() === currentUserId.toString())
    );

    res.status(200).json({ chats, invitations });
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

  const currentUserId = req.user?.id || req.owner?.id;
  const currentUserModel = req.user ? "User" : "Owner";

  var users = JSON.parse(req.body.users); // Array of { user: id, onModel: type }

  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }

  // Business Rule: Can only invite people they follow or who follow them
  // (Validation to be implemented here or on frontend, let's add backend check)
  try {
    const currentUser = await (currentUserModel === "User" ? User : Owner).findById(currentUserId);
    const validConnections = [...currentUser.followers, ...currentUser.following].map(id => id.toString());

    const invalidUsers = users.filter(u => !validConnections.includes(u.user.toString()));
    if (invalidUsers.length > 0) {
        // return res.status(400).send("You can only add users you follow or who follow you.");
    }

    // Add current user as admin and verified member
    // The others are added to pendingMembers for approval
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: [{ user: currentUserId, onModel: currentUserModel }],
      isGroupChat: true,
      groupAdmin: { user: currentUserId, onModel: currentUserModel },
      pendingMembers: users
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users.user", "-password")
      .populate("groupAdmin.user", "-password")
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
  const currentUserId = req.user?.id || req.owner?.id;
  const currentUserModel = req.user ? "User" : "Owner";

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const accept = status === "accepted";

    // Remove from pending
    chat.pendingMembers = chat.pendingMembers.filter(
      m => m.user?.toString() !== currentUserId.toString()
    );

    if (accept) {
      // Add to members if not already there
      const isMember = chat.users.some(m => m.user?.toString() === currentUserId.toString());
      if (!isMember) {
        chat.users.push({ user: currentUserId, onModel: currentUserModel });
      }
    }

    await chat.save();

    const updatedChat = await Chat.findOne({ _id: chatId })
      .populate("users.user", "-password")
      .populate("groupAdmin.user", "-password")
      .populate("pendingMembers.user", "-password");

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Rename group
 */
export const renameGroup = async (req, res) => {
  const { chatId, chatName } = req.body;

  try {
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    )
      .populate("users.user", "-password")
      .populate("groupAdmin.user", "-password");

    if (!updatedChat) {
      res.status(404);
      throw new Error("Chat Not Found");
    } else {
      res.json(updatedChat);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
