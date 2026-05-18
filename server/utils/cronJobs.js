import nodeCron from "node-cron";
import { prisma } from "../config/prisma.js";
import logger from "./logger.js";

/**
 * Initializes all recurring maintenance cron jobs.
 *
 * Schedule overview:
 *  - 00:00 — Purge expired/revoked refresh tokens
 *  - 00:05 — Delete expired Stories (expiresAt < now)
 *  - 03:00 — Delete media records stuck in "failed" state for > 24 h
 */
export const initCronJobs = () => {

  // ── Midnight: Expired & revoked refresh token cleanup ──────────────────────
  nodeCron.schedule("0 0 * * *", async () => {
    logger.info("[CRON] Purging expired/revoked refresh tokens...");
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { revokedAt: { lt: new Date() } }
          ]
        }
      });
      logger.info(`[CRON] Token cleanup complete — removed ${result.count} tokens.`);
    } catch (error) {
      logger.error("[CRON] Token cleanup error:", error);
    }
  });

  // ── 00:05: Expired Story deletion ─────────────────────────────────────────
  // Stories have a 1–7 day TTL controlled by `expiresAt`. Without this job
  // expired stories would accumulate indefinitely in the DB and in the feed.
  nodeCron.schedule("5 0 * * *", async () => {
    logger.info("[CRON] Purging expired stories...");
    try {
      const result = await prisma.story.deleteMany({
        where: { expiresAt: { lt: new Date() } }
      });
      logger.info(`[CRON] Story cleanup complete — removed ${result.count} expired stories.`);
    } catch (error) {
      logger.error("[CRON] Story cleanup error:", error);
    }
  });

  // ── 03:00: Failed media record cleanup ────────────────────────────────────
  // Reels, Stories, and Posts stuck in `status: "failed"` for more than 24 hours
  // should be purged so users can re-upload without being blocked by ghost records.
  nodeCron.schedule("0 3 * * *", async () => {
    logger.info("[CRON] Purging stale failed media records...");
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    try {
      const [reels, stories, posts] = await Promise.all([
        prisma.reel.deleteMany({
          where: { status: "failed", updatedAt: { lt: cutoff } }
        }),
        prisma.story.deleteMany({
          where: { status: "failed", updatedAt: { lt: cutoff } }
        }),
        prisma.post.deleteMany({
          where: { status: "failed", updatedAt: { lt: cutoff } }
        }),
      ]);
      logger.info(
        `[CRON] Failed media cleanup — reels: ${reels.count}, stories: ${stories.count}, posts: ${posts.count}`
      );
    } catch (error) {
      logger.error("[CRON] Failed media cleanup error:", error);
    }
  });

  logger.info("[CRON] All cron jobs initialized (token cleanup, story expiry, media cleanup).");
};

