import { Queue, Worker } from 'bullmq';
import { bullmqConnection as connection } from '../config/redis.js';
import { prisma } from '../config/prisma.js';
import logger from '../utils/logger.js';
import { processMatchCompleted } from '../services/playerStatsAggregator.service.js';
import { runMilestoneSweep } from '../services/achievement.service.js';
import { snapshotLeaderboards } from '../services/leaderboardSnapshot.service.js';

/**
 * playerStats queue — receives `match-completed` events when a match ends.
 * One job per match. The worker writes MatchParticipant rows, upserts
 * PlayerCareerStats deltas (matches/wins/streaks/sport-specific counters),
 * and inserts XpEvent rows for every participant.
 *
 * Job payload shape (see services/matchCompletedEmitter.js):
 *   {
 *     matchId:       string,          // logical match id (cricketMatch.id, etc.)
 *     hostedGameId:  string,
 *     sport:         string,          // canonical SPORTS value
 *     completedAt:   ISO string,
 *     participants: [{
 *       userId, teamId?, role?, result, // 'won' | 'lost' | 'draw'
 *       runs?, wickets?, goals?, assists?, minutesPlayed?, isMotm?
 *     }]
 *   }
 */
export const playerStatsQueue = new Queue('playerStats', { connection });

/**
 * Register repeatable jobs. Called once at boot from server.js.
 */
export async function initPlayerStatsJobs() {
  await playerStatsQueue.removeRepeatableByKey('milestone-sweep-singleton');
  await playerStatsQueue.removeRepeatableByKey('profile-view-cleanup-singleton');
  await playerStatsQueue.removeRepeatableByKey('leaderboard-snapshot-singleton');

  // Nightly at 02:00 UTC. cron syntax: minute hour * * *
  await playerStatsQueue.add(
    'milestone-sweep',
    {},
    { repeat: { pattern: '0 2 * * *' }, jobId: 'milestone-sweep-singleton' }
  );

  // Daily at 03:00 UTC — prunes ProfileView rows older than 30 days so the
  // table stays bounded even on viral profiles.
  await playerStatsQueue.add(
    'profile-view-cleanup',
    {},
    { repeat: { pattern: '0 3 * * *' }, jobId: 'profile-view-cleanup-singleton' }
  );

  // Hourly leaderboard pre-compute. Caches per-sport per-city top-100 into
  // Redis so the leaderboard endpoint takes Postgres off the hot path.
  await playerStatsQueue.add(
    'leaderboard-snapshot',
    {},
    { repeat: { pattern: '0 * * * *' }, jobId: 'leaderboard-snapshot-singleton' }
  );

  logger.info('[PLAYER_STATS] Scheduled: milestone (02:00), profile-view cleanup (03:00), leaderboard snapshot (hourly)');
  return { playerStatsQueue };
}

export const playerStatsWorker = new Worker(
  'playerStats',
  async (job) => {
    if (job.name === 'match-completed') {
      await processMatchCompleted(job.data);
    }
    if (job.name === 'milestone-sweep') {
      await runMilestoneSweep({ lookbackDays: 7 });
    }
    if (job.name === 'profile-view-cleanup') {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { count } = await prisma.profileView.deleteMany({
        where: { viewedAt: { lt: cutoff } },
      });
      logger.info(`[PLAYER_STATS] Pruned ${count} ProfileView rows older than 30d`);
    }
    if (job.name === 'leaderboard-snapshot') {
      const written = await snapshotLeaderboards();
      logger.info(`[PLAYER_STATS] Wrote ${written} leaderboard snapshots to Redis`);
    }
  },
  {
    connection,
    concurrency: 2,
  }
);

playerStatsWorker.on('failed', (job, err) => {
  logger.error(`[PLAYER_STATS] Job ${job?.name} failed for match ${job?.data?.matchId}:`, err.message);
  import('@sentry/node').then((s) =>
    s.captureException(err, { tags: { job: job?.name, matchId: job?.data?.matchId } })
  ).catch(() => {});
});

playerStatsWorker.on('completed', (job) => {
  logger.info(`[PLAYER_STATS] Aggregated match ${job?.data?.matchId} (${job?.data?.participants?.length || 0} participants)`);
});
