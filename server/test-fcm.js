import dotenv from "dotenv";
dotenv.config();

import { prisma } from "./config/prisma.js";
import { sendPushNotification } from "./utils/pushHelper.js";
import logger from "./utils/logger.js";

async function run() {
  logger.info("Starting FCM push notification diagnostics...");

  try {
    // 1. Fetch any users with active FCM tokens
    const users = await prisma.user.findMany({
      where: {
        NOT: {
          fcmToken: null
        }
      },
      select: {
        id: true,
        name: true,
        fcmToken: true
      }
    });

    if (users.length === 0) {
      logger.warn("No users found with registered fcmToken in the database.");
      logger.info("Diagnostics completed: Database is reachable but no devices are registered yet.");
      return;
    }

    logger.info(`Found ${users.length} user(s) with registered FCM tokens.`);

    // 2. Dispatch a diagnostic test notification to all registered tokens
    for (const user of users) {
      logger.info(`Dispatching diagnostic push to User: ${user.name} (ID: ${user.id})...`);
      const response = await sendPushNotification(
        user.fcmToken,
        "Kridaz Diagnostics",
        `Hi ${user.name}, this is a test push notification to verify everything is working perfectly!`,
        { test: "true", timestamp: String(Date.now()) }
      );
      
      if (response) {
        logger.info(`Successfully sent to ${user.name}! Response ID: ${response}`);
      } else {
        logger.warn(`Failed to send push notification to ${user.name} (likely mock mode or invalid token).`);
      }
    }

    logger.info("FCM push notification diagnostics completed successfully.");
  } catch (error) {
    logger.error("Error during FCM diagnostics:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
