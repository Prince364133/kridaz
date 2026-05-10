import Message from "../../models/message.model.js";
import Chat from "../../models/chat.model.js";
import User from "../../models/user.model.js";

/**
 * Get all messages for a specific chat
 */
export const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
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

  const currentUserId = req.user?.id || req.owner?.id;
  const currentUserModel = req.user ? "User" : "Owner";

  var newMessage = {
    sender: { user: currentUserId, onModel: currentUserModel },
    content: content,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender.user", "name profilePicture profileImage");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users.user",
      select: "name profilePicture profileImage email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
