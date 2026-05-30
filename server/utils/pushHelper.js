import admin from "../config/firebase.js";
import logger from "./logger.js";

/**
 * Sends a push notification to a specific device token
 * @param {string} fcmToken - Recipient's device token
 * @param {string} title - Title of the notification
 * @param {string} body - Main text content
 * @param {object} [data] - Optional key-value metadata payload for deep linking
 */
export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;

  // If Firebase Admin isn't initialized or running in mock mode, skip actual dispatch
  if (!admin || !admin.apps.length) {
    logger.info(`[Push Notification Mock] To: ${fcmToken} | Title: ${title} | Body: ${body} | Data: ${JSON.stringify(data)}`);
    return;
  }

  // Ensure all keys and values in data are strings
  const stringifiedData = {};
  if (data) {
    Object.entries(data).forEach(([key, val]) => {
      stringifiedData[key] = val !== null && val !== undefined ? String(val) : "";
    });
  }

  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
    data: {
      ...stringifiedData,
      click_action: stringifiedData.link || "", 
    },
    android: {
      priority: "high",
      notification: {
        sound: "default",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    logger.info(`[Push Notification] Successfully sent message ID: ${response}`);
    return response;
  } catch (error) {
    logger.error(`[Push Notification] Error sending to token ${fcmToken}:`, error);
  }
};
