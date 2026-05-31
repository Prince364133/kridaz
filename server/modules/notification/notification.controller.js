import { prisma } from "../../config/prisma.js";

const getRecipientQuery = (req) => {
  const actor = req.user || req.owner || req.admin;
  const id = actor?.id || actor?.userId || actor?._id;
  const ownerId = actor?.ownerId;
  const role = actor?.role?.toString().toLowerCase() || "";

  if (!id && !ownerId) {
    const error = new Error("Authenticated recipient could not be resolved");
    error.statusCode = 401;
    throw error;
  }

  // Admins are stored as users. Business actors use their owner profile stream.
  if (ownerId && role !== "admin" && role !== "bmsp_admin") {
    return { ownerId, recipientModel: 'Owner' };
  }

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
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
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
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
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
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
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
  const { token, platform = "mobile" } = req.body;
  try {
    const id = req.user?.id || req.user?.userId || req.user?._id;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }
    if (!id) {
      return res.status(401).json({ success: false, message: "Authenticated user could not be resolved" });
    }

    // 1. Register or update the token in the UserDevice model
    await prisma.userDevice.upsert({
      where: { token },
      update: { userId: id, platform },
      create: { userId: id, token, platform }
    });

    // 2. Safely keep user.fcmToken updated as a fallback for backwards compatibility
    await prisma.user.update({
      where: { id },
      data: { fcmToken: token }
    }).catch(err => console.error("Fallback user fcmToken update error:", err));

    res.status(200).json({ success: true, message: "Device token registered successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


