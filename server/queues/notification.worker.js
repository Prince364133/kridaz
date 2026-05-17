import { Worker } from "bullmq";
import { bullmqConnection as connection } from "../config/redis.js";
import logger from "../utils/logger.js";
import { 
  sendWhatsAppMessage, 
  notifyNewGame, 
  sendCustomPlayerInvite, 
  sendCustomUmpireInvite 
} from "../utils/notification.service.js";
import generateEmail from "../utils/generateEmail.js";
import { createNotification, notifyAdmins } from "../utils/notificationHelper.js";

/**
 * Worker to process notification jobs
 */
const worker = new Worker(
  "notifications",
  async (job) => {
    const { name, data } = job;
    logger.info(`[Notification Worker] Processing job: ${name} (${job.id})`);

    try {
      switch (name) {
        case "SEND_OTP": {
          const { phone, email, otp, type, phoneTemplate, emailSubject, emailHtml } = data;
          
          const promises = [];
          if (email && emailSubject && emailHtml) {
            promises.push(generateEmail(email, emailSubject, emailHtml));
          }
          if (phone) {
            if (phoneTemplate) {
              promises.push(sendWhatsAppMessage(phone, "", phoneTemplate, [otp]));
            } else {
              promises.push(sendWhatsAppMessage(phone, `Your Kridaz verification code is: ${otp}`));
            }
          }
          await Promise.all(promises);
          break;
        }

        case "ADMIN_ALERT": {
          const { title, message, type, link, metadata } = data;
          await notifyAdmins({ title, message, type, link, metadata });
          break;
        }

        case "IN_APP_NOTIF": {
          const { recipientId, recipientModel, title, message, type, link, metadata } = data;
          await createNotification({ recipientId, recipientModel, title, message, type, link, metadata });
          break;
        }

        case "SEND_EMAIL": {
          const { to, subject, html, attachments } = data;
          await generateEmail(to, subject, html, attachments);
          break;
        }

        case "SEND_WHATSAPP": {
          const { phone, message, templateName, params } = data;
          await sendWhatsAppMessage(phone, message, templateName, params);
          break;
        }
        
        case "NOTIFY_NEW_GAME": {
          const { game, host } = data;
          await notifyNewGame(game, host);
          break;
        }

        case "CUSTOM_PLAYER_INVITE": {
          const { customPlayer, game, host } = data;
          await sendCustomPlayerInvite(customPlayer, game, host);
          break;
        }

        case "CUSTOM_UMPIRE_INVITE": {
          const { customUmpire, game, host } = data;
          await sendCustomUmpireInvite(customUmpire, game, host);
          break;
        }

        default:
          logger.warn(`[Notification Worker] Unknown job type: ${name}`);
      }
      
      logger.info(`[Notification Worker] Job ${job.id} (${name}) completed successfully.`);
    } catch (error) {
      logger.error(`[Notification Worker] Job ${job.id} (${name}) failed:`, error);
      throw error; // Re-throw to trigger BullMQ retry
    }
  },
  { connection, concurrency: 5 }
);

worker.on("failed", (job, err) => {
  logger.error(`[Notification Worker] Job ${job?.id} failed after all retries:`, err);
});

export default worker;
