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
  if (!fcmToken || (Array.isArray(fcmToken) && fcmToken.length === 0)) return;

  const tokens = Array.isArray(fcmToken) ? fcmToken : [fcmToken];

  // If Firebase Admin isn't initialized or running in mock mode, skip actual dispatch
  if (!admin || !admin.apps.length) {
    logger.info(`[Push Notification Mock] To: ${JSON.stringify(tokens)} | Title: ${title} | Body: ${body} | Data: ${JSON.stringify(data)}`);
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
    tokens,
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
    const response = await admin.messaging().sendEachForMulticast(message);
    logger.info(`[Push Notification] Multicast delivery finished. Success count: ${response.successCount}, Failure count: ${response.failureCount}`);
    
    // Log failures if any occurred
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          logger.warn(`[Push Notification] Failed to deliver to token ${tokens[idx]}: ${resp.error.message}`);
        }
      });
    }
    return response;
  } catch (error) {
    logger.error(`[Push Notification] Error sending multicast message:`, error);
  }
};
