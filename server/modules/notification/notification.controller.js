import Notification from "../../models/notification.model.js";

const getRecipient = (req) => {
  const { ownerId, id } = req.user;
  // If ownerId exists in the token, this is a partner/admin notification stream
  if (ownerId) {
    return { recipientId: ownerId, recipientModel: 'Owner' };
  }
  // Otherwise, it's a general user notification stream
  return { recipientId: id, recipientModel: 'User' };
};

export const getMyNotifications = async (req, res) => {
  try {
    const { recipientId, recipientModel } = getRecipient(req);

    const notifications = await Notification.find({ 
      recipient: recipientId, 
      recipientModel 
    }).sort({ createdAt: -1 }).limit(50);

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const { recipientId, recipientModel } = getRecipient(req);

    await Notification.updateMany(
      { recipient: recipientId, recipientModel, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ success: true, message: "All marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearNotifications = async (req, res) => {
  try {
    const { recipientId, recipientModel } = getRecipient(req);

    await Notification.deleteMany({ recipient: recipientId, recipientModel });
    res.status(200).json({ success: true, message: "Notifications cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
