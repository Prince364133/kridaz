import { notificationQueue } from "../queues/notification.queue.js";
import logger from "../utils/logger.js";

/**
 * NotificationService - The single entry point for sending any notification.
 * All methods are asynchronous and return immediately after queuing the job.
 */
const NotificationService = {
  /**
   * Send OTP via Email and/or WhatsApp
   */
  async sendOTP({ phone, email, otp, type, phoneTemplate, emailSubject, emailHtml }) {
    try {
      await notificationQueue.add("SEND_OTP", {
        phone,
        email,
        otp,
        type,
        phoneTemplate,
        emailSubject,
        emailHtml
      });
      return true;
    } catch (error) {
      logger.error("[Notification Service] Error queuing SEND_OTP:", error);
      return false;
    }
  },

  /**
   * Send an Admin Alert
   */
  async notifyAdmins({ title, message, type, link, metadata = {} }) {
    try {
      await notificationQueue.add("ADMIN_ALERT", {
        title,
        message,
        type,
        link,
        metadata
      });
      return true;
    } catch (error) {
      logger.error("[Notification Service] Error queuing ADMIN_ALERT:", error);
      return false;
    }
  },

  /**
   * Send an In-App Notification to a user/owner
   */
  async sendInApp({ recipientId, recipientModel, title, message, type, link, metadata = {} }) {
    try {
      await notificationQueue.add("IN_APP_NOTIF", {
        recipientId,
        recipientModel,
        title,
        message,
        type,
        link,
        metadata
      });
      return true;
    } catch (error) {
      logger.error("[Notification Service] Error queuing IN_APP_NOTIF:", error);
      return false;
    }
  },

  /**
   * Generic Email Sender
   */
  async sendEmail({ to, subject, html, attachments = [] }) {
    try {
      await notificationQueue.add("SEND_EMAIL", { to, subject, html, attachments });
      return true;
    } catch (error) {
      logger.error("[Notification Service] Error queuing SEND_EMAIL:", error);
      return false;
    }
  },

  /**
   * Send WhatsApp Notification
   */
  async sendWhatsApp({ phone, message, templateName = null, params = [] }) {
    try {
      await notificationQueue.add("SEND_WHATSAPP", { phone, message, templateName, params });
      return true;
    } catch (error) {
      logger.error("[Notification Service] Error queuing SEND_WHATSAPP:", error);
      return false;
    }
  },

  /**
   * Notify users in the same area about a new game
   */
  async notifyNewGame({ game, host }) {
    try {
      await notificationQueue.add("NOTIFY_NEW_GAME", { game, host });
      return true;
    } catch (error) {
      logger.error("[Notification Service] Error queuing NOTIFY_NEW_GAME:", error);
      return false;
    }
  },

  /**
   * Invite an off-platform custom player
   */
  async sendCustomPlayerInvite({ customPlayer, game, host }) {
    try {
      await notificationQueue.add("CUSTOM_PLAYER_INVITE", { customPlayer, game, host });
      return true;
    } catch (error) {
      logger.error("[Notification Service] Error queuing CUSTOM_PLAYER_INVITE:", error);
      return false;
    }
  },

  /**
   * Invite an off-platform custom umpire
   */
  async sendCustomUmpireInvite({ customUmpire, game, host }) {
    try {
      await notificationQueue.add("CUSTOM_UMPIRE_INVITE", { customUmpire, game, host });
      return true;
    } catch (error) {
      logger.error("[Notification Service] Error queuing CUSTOM_UMPIRE_INVITE:", error);
      return false;
    }
  }
};

export default NotificationService;
