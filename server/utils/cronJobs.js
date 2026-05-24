import nodeCron from "node-cron";
import { prisma } from "../config/prisma.js";
import logger from "./logger.js";

/**
 * Initializes all recurring maintenance cron jobs.
 *
 * Schedule overview:
 *  - 00:00 â€” Purge expired/revoked refresh tokens
 *  - 00:05 â€” Delete expired Stories (expiresAt < now)
 *  - 03:00 â€” Delete media records stuck in "failed" state for > 24 h
 */
export const initCronJobs = () => {

  // â”€â”€ Midnight: Expired & revoked refresh token cleanup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      logger.info(`[CRON] Token cleanup complete â€” removed ${result.count} tokens.`);
    } catch (error) {
      logger.error("[CRON] Token cleanup error:", error);
    }
  });

  // â”€â”€ 00:05: Expired Story deletion â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Stories have a 1â€“7 day TTL controlled by `expiresAt`. Without this job
  // expired stories would accumulate indefinitely in the DB and in the feed.
  nodeCron.schedule("5 0 * * *", async () => {
    logger.info("[CRON] Purging expired stories...");
    try {
      const expiredStories = await prisma.story.findMany({
        where: { expiresAt: { lt: new Date() } }
      });

      if (expiredStories.length > 0) {
        logger.info(`[CRON] Found ${expiredStories.length} expired stories. Deleting files from R2...`);
        const { deleteStoryFilesFromR2 } = await import("./r2.js");
        
        await Promise.all(
          expiredStories.map(story => deleteStoryFilesFromR2(story).catch(err => logger.error(`[CRON] R2 cleanup error for story ${story.id}:`, err)))
        );

        const result = await prisma.story.deleteMany({
          where: { id: { in: expiredStories.map(s => s.id) } }
        });
        logger.info(`[CRON] Story cleanup complete â€” removed ${result.count} expired stories.`);
      } else {
        logger.info("[CRON] No expired stories to purge.");
      }
    } catch (error) {
      logger.error("[CRON] Story cleanup error:", error);
    }
  });
 
  // â”€â”€ 03:00: Failed media record cleanup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Reels, Stories, and Posts stuck in `status: "failed"` for more than 24 hours
  // should be purged so users can re-upload without being blocked by ghost records.
  nodeCron.schedule("0 3 * * *", async () => {
    logger.info("[CRON] Purging stale failed media records...");
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    try {
      // Find failed stories older than cutoff to purge R2 files
      const failedStories = await prisma.story.findMany({
        where: { status: "failed", updatedAt: { lt: cutoff } }
      });

      if (failedStories.length > 0) {
        logger.info(`[CRON] Found ${failedStories.length} stale failed stories. Deleting files from R2...`);
        const { deleteStoryFilesFromR2 } = await import("./r2.js");
        await Promise.all(
          failedStories.map(story => deleteStoryFilesFromR2(story).catch(err => logger.error(`[CRON] R2 cleanup error for failed story ${story.id}:`, err)))
        );
      }

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
        `[CRON] Failed media cleanup â€” reels: ${reels.count}, stories: ${stories.count}, posts: ${posts.count}`
      );
    } catch (error) {
      logger.error("[CRON] Failed media cleanup error:", error);
    }
  });

  // â”€â”€ Every Hour: Auto-end matches exceeding duration limit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  nodeCron.schedule("0 * * * *", async () => {
    await autoEndExpiredMatches();
  });

  logger.info("[CRON] All cron jobs initialized (token cleanup, story expiry, media cleanup, match auto-end).");
};

/**
 * Automatically finalize matches that have been running for longer than their allowed duration.
 */
export const autoEndExpiredMatches = async () => {
  logger.info("[CRON] Checking for expired live matches to auto-end...");
  try {
    const activeGames = await prisma.hostedGame.findMany({
      where: {
        gameType: "SCORING_MATCH",
        scoringStatus: { in: ["LIVE", "PAUSED"] }
      },
      include: {
        cricketMatch: true
      }
    });

    logger.info(`[CRON] Found ${activeGames.length} active scoring matches in progress.`);

    let endCount = 0;
    const { finalizeMatch } = await import("../modules/scoring/scoring.service.js");

    for (const game of activeGames) {
      if (!game.cricketMatch) {
        continue;
      }

      const matchStart = new Date(game.cricketMatch.createdAt).getTime();
      const matchDays = game.customDays || 1;
      const allowedDurationMs = matchDays * 24 * 60 * 60 * 1000;
      const elapsedTimeMs = Date.now() - matchStart;

      if (elapsedTimeMs > allowedDurationMs) {
        logger.info(`[CRON] Match ${game.id} ("${game.name}") has exceeded its allowed duration of ${matchDays} day(s). Elapsed: ${(elapsedTimeMs / (1000 * 60 * 60)).toFixed(1)} hours. Auto-ending match...`);
        try {
          await finalizeMatch(game.cricketMatch.id);
          logger.info(`[CRON] Successfully auto-ended match ${game.id}.`);
          endCount++;
        } catch (finalizeError) {
          logger.error(`[CRON] Failed to auto-end match ${game.id}:`, finalizeError);
        }
      }
    }

    if (endCount > 0) {
      logger.info(`[CRON] Expired match cleanup complete â€” auto-ended ${endCount} matches.`);
    } else {
      logger.info("[CRON] No matches needed auto-ending.");
    }
  } catch (error) {
    logger.error("[CRON] Error during auto-ending expired matches:", error);
  }
};


export const autoSettleHostedGames = async () => {
  logger.info("[CRON] Checking for pending hosted games to auto-settle...");
  try {
    const pendingGames = await prisma.hostedGame.findMany({
      where: {
        coinTransferStatus: "PENDING",
        perPlayerCharge: { gt: 0 }
      },
      include: {
        slots: true
      }
    });

    let settledCount = 0;
    const { default: WalletService } = await import("../services/wallet.service.js");
    const now = new Date();

    for (const game of pendingGames) {
      const [hours, minutes] = (game.time || "00:00").split(':').map(Number);
      const scheduledStart = new Date(game.date);
      scheduledStart.setHours(hours || 0, minutes || 0, 0, 0);

      const cutoffTime = new Date(scheduledStart.getTime() + 24 * 60 * 60 * 1000);

      if (now > cutoffTime) {
        logger.info("[CRON] Auto-settling game 24 hours passed since scheduled start.");
        try {
          await prisma.$transaction(async (tx) => {
            await tx.hostedGame.update({
              where: { id: game.id },
              data: { coinTransferStatus: "COMPLETED" }
            });

            const totalPaidSlots = game.slots.filter(s => s.status === "JOINED" && s.userId).length;
            const totalAmount = Number(game.perPlayerCharge) * totalPaidSlots;
            
            if (totalAmount > 0) {
              await WalletService.credit(game.hostId, 'user', totalAmount, tx);
              await tx.walletTransaction.create({
                data: {
                  userId: game.hostId,
                  amount: totalAmount,
                  type: "SLOT_INCOME",
                  status: "SUCCESS",
                  description: "Received payment from players for game (Auto-settled)"
                }
              });
            }
          });
          settledCount++;
        } catch (err) {
          logger.error("[CRON] Error auto-settling game: ", err);
        }
      }
    }

    if (settledCount > 0) {
      logger.info(`[CRON] Auto-settlement complete — settled ${settledCount} games.`);
    }
  } catch (error) {
    logger.error("[CRON] Error during auto-settlement:", error);
  }
};