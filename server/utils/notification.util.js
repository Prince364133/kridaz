import Notification from "../models/notification.model.js";

/**
 * Create a new notification in the database
 * @param {Object} params - Notification parameters
 * @param {string} params.recipientId - ID of the User, Owner, or Admin
 * @param {string} params.recipientModel - "User", "Owner", or "Admin"
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification content
 * @param {string} params.type - Category (e.g., BOOKING, DISPUTE, WALLET)
 * @param {string} params.actionUrl - URL to redirect the user when clicked
 * @param {Object} params.metadata - Extra data (optional)
 */
export const createNotification = async ({
  recipientId,
  recipientModel,
  title,
  message,
  type,
  actionUrl,
  metadata = {}
}) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      recipientModel,
      title,
      message,
      type,
      actionUrl,
      metadata,
      isRead: false
    });
    return notification;
  } catch (error) {
    console.error("[NOTIFICATION_UTIL] Error creating notification:", error);
    return null;
  }
};
