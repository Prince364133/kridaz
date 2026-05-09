import Notification from "../../models/notification.model.js";

export const getMyNotifications = async (req, res) => {
  try {
    // Determine recipient from req.user, req.owner, or req.admin
    let recipientId;
    let recipientModel;

    if (req.user) {
      recipientId = req.user.id;
      recipientModel = 'User';
    } else if (req.owner) {
      recipientId = req.owner.id;
      recipientModel = 'Owner';
    } else if (req.admin) {
      // Admin might also be stored in Owner model or a separate Admin model
      // Looking at previous sessions, Admin seems to have req.admin
      // If there's no Admin model, we might use Owner model with role 'admin'
      recipientId = req.admin.id;
      recipientModel = 'Owner'; 
    }

    if (!recipientId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

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
    let recipientId = req.user?.id || req.owner?.id || req.admin?.id;
    let recipientModel = req.user ? 'User' : 'Owner';

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
    let recipientId = req.user?.id || req.owner?.id || req.admin?.id;
    let recipientModel = req.user ? 'User' : 'Owner';

    await Notification.deleteMany({ recipient: recipientId, recipientModel });
    res.status(200).json({ success: true, message: "Notifications cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
