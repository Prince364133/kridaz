import { prisma } from "../config/prisma.js";
import logger from "../utils/logger.js";
import { sendPushNotification } from "../utils/pushHelper.js";

export const getUserDeviceTokens = async (userId) => {
  if (!userId) return [];

  const [user, userDevices] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true }
    }),
    prisma.userDevice.findMany({
      where: { userId },
      select: { token: true }
    })
  ]);

  const tokenSet = new Set();
  if (user?.fcmToken) tokenSet.add(user.fcmToken);
  userDevices.forEach((device) => {
    if (device.token) tokenSet.add(device.token);
  });

  return Array.from(tokenSet);
};

export const processInAppNotification = async ({
  recipientId,
  recipientModel,
  title,
  message,
  type,
  link,
  metadata = {}
}) => {
  const data = {
    title,
    message,
    type,
    link,
    metadata,
    recipientModel
  };

  if (recipientModel === "User") {
    data.userId = recipientId;
  } else {
    data.ownerId = recipientId;
  }

  const dbNotification = await prisma.notification.create({ data });
  let pushResult = null;
  let tokenCount = 0;

  if (recipientModel === "User") {
    try {
      const tokens = await getUserDeviceTokens(recipientId);
      tokenCount = tokens.length;

      if (tokens.length > 0) {
        pushResult = await sendPushNotification(tokens, title, message, {
          notificationId: dbNotification.id,
          link: link || "",
          type: type || ""
        });
      }
    } catch (error) {
      logger.error("[Notification Dispatcher] Push dispatch failed:", error);
      pushResult = {
        successCount: 0,
        failureCount: tokenCount,
        error: error.message
      };
    }
  }

  return {
    notification: dbNotification,
    tokenCount,
    pushResult
  };
};

