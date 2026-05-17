import nodeCron from "node-cron";
import { prisma } from "../config/prisma.js";
import logger from "./logger.js";

/**
 * Initializes all cron jobs for the server.
 */
export const initCronJobs = () => {
    // Run every night at midnight (0 0 * * *)
    nodeCron.schedule("0 0 * * *", async () => {
        logger.info("Running Cleanup: Purging expired/revoked refresh tokens...");
        try {
            const result = await prisma.refreshToken.deleteMany({
                where: {
                    OR: [
                        { expiresAt: { lt: new Date() } },
                        { revokedAt: { lt: new Date() } }
                    ]
                }
            });
            logger.info(`Cleanup Complete: Removed ${result.count} tokens.`);
        } catch (error) {
            logger.error("Cleanup Error:", error);
        }
    });

    logger.info("Cron jobs initialized.");
};
