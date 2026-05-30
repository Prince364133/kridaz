import { prisma } from "../../config/prisma.js";

const getRecipientQuery = (req) => {
  const { ownerId, id } = req.user;
  // If ownerId exists in the token, this is a partner/admin notification stream
  if (ownerId) {
    return { ownerId: ownerId, recipientModel: 'Owner' };
  }
  // Otherwise, it's a general user notification stream
  return { userId: id, recipientModel: 'User' };
};

export const getMyNotifications = async (req, res) => {
  try {
    const query = getRecipientQuery(req);

    const notifications = await prisma.notification.findMany({ 
      where: query,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const query = getRecipientQuery(req);

    await prisma.notification.updateMany({
      where: { ...query, isRead: false },
      data: { isRead: true }
    });
    res.status(200).json({ success: true, message: "All marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearNotifications = async (req, res) => {
  try {
    const query = getRecipientQuery(req);

    await prisma.notification.deleteMany({
      where: query
    });
    res.status(200).json({ success: true, message: "Notifications cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveDeviceToken = async (req, res) => {
  const { token } = req.body;
  try {
    const { id } = req.user;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }

    await prisma.user.update({
      where: { id },
      data: { fcmToken: token }
    });

    res.status(200).json({ success: true, message: "Device token saved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


