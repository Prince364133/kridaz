import Notification from "../models/notification.model.js";

/**
 * Create a notification for a user or partner
 * @param {string} recipientId - ID of the user/owner
 * @param {string} recipientModel - 'User' or 'Owner'
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Enum: BOOKING, PAYMENT, REVIEW, SUPPORT, WITHDRAWAL, SYSTEM
 * @param {string} link - Navigation link for frontend
 * @param {object} metadata - Extra data
 */
export const createNotification = async ({
  recipientId,
  recipientModel,
  title,
  message,
  type,
  link,
  metadata = {}
}) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      recipientModel,
      title,
      message,
      type,
      link,
      metadata
    });
    return notification;
  } catch (error) {
    console.error("[CREATE_NOTIFICATION_ERROR]:", error.message);
  }
};

/**
 * Notify all administrators
 */
export const notifyAdmins = async ({ title, message, type, link, metadata = {} }) => {
  try {
    const Owner = (await import("../models/owner.model.js")).default;
    const admins = await Owner.find({ role: { $in: ["admin", "BMSP_ADMIN"] } }).select("_id");
    
    const notifications = admins.map(admin => ({
      recipient: admin._id,
      recipientModel: 'Owner',
      title,
      message,
      type,
      link,
      metadata
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error("[NOTIFY_ADMINS_ERROR]:", error.message);
  }
};
