import { prisma } from '../config/prisma.js';
import logger from '../utils/logger.js';
import { grantXp } from './xp.service.js';

/**
 * Idempotent. Inserts a UserAchievement row for (userId, achievement.code).
 * Duplicate (already-earned) calls are no-ops — the compound PK absorbs them.
 *
 * `context` is a free-form JSONB blob: matchId, season, score, etc. — useful
 * for "earned during X" badges later.
 *
 * Per spec the trophy/badge tier itself can carry XP, e.g. trophy=100 xp.
 * We grant `xpReward` if the catalog row has one in `criteria.xpReward`.
 */
export async function awardAchievement({ userId, code, context = {} }) {
  if (!userId || !code) return null;
  try {
    const achievement = await prisma.achievement.findUnique({ where: { code } });
    if (!achievement) {
      logger.warn(`[ACHIEVEMENT] Unknown code "${code}" — add to the catalog before awarding`);
      return null;
    }

    const existing = await prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
    });
    if (existing) return existing;

    const row = await prisma.userAchievement.create({
      data: { userId, achievementId: achievement.id, context },
    });

    const xpReward = Number(achievement.criteria?.xpReward) || 0;
    if (xpReward > 0) {
      grantXp({ userId, source: 'achievement', amount: xpReward, referenceId: achievement.id })
        .catch(err => logger.warn('[ACHIEVEMENT] xp grant failed:', err?.message));
    }
    return row;
  } catch (err) {
    logger.error(`[ACHIEVEMENT] awardAchievement(${code}) failed for ${userId}:`, err);
    return null;
  }
}

/**
 * Sweep that runs nightly. Looks at PlayerCareerStats + per-match
 * MatchParticipant facts for users who played in the last `lookbackDays`
 * (cheap; ignores cold users) and awards any qualifying milestones.
 *
 * Adding a new milestone? Drop a row into the Achievement table and add a
 * branch below — no schema migration needed for catalog growth.
 */
export async function runMilestoneSweep({ lookbackDays = 7 } = {}) {
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

  // Recently-active users only. Avoid scanning every row each night.
  const recentParticipants = await prisma.matchParticipant.findMany({
    where: { playedAt: { gte: since } },
    select: { userId: true },
    distinct: ['userId'],
  });

  let awarded = 0;
  for (const { userId } of recentParticipants) {
    const stats = await prisma.playerCareerStats.findMany({ where: { userId } });
    for (const s of stats) {
      const ctx = { sport: s.sportType, matches: s.matchesPlayed, wins: s.matchesWon };

      if (s.matchesPlayed >= 10  && (await tryAward(userId, 'milestone_10_matches',  ctx)))  awarded++;
      if (s.matchesPlayed >= 50  && (await tryAward(userId, 'milestone_50_matches',  ctx)))  awarded++;
      if (s.matchesPlayed >= 100 && (await tryAward(userId, 'milestone_100_matches', ctx)))  awarded++;
      if (s.matchesPlayed >= 500 && (await tryAward(userId, 'milestone_500_matches', ctx)))  awarded++;

      if (s.matchesWon >= 10 && (await tryAward(userId, 'invincible', ctx))) awarded++;

      if (s.sportType === 'CRICKET' && s.centuries >= 1 &&
          (await tryAward(userId, 'first_century', { ...ctx, centuries: s.centuries }))) awarded++;
    }

    // First match (any sport).
    const totalMatches = stats.reduce((sum, s) => sum + s.matchesPlayed, 0);
    if (totalMatches >= 1 && (await tryAward(userId, 'rising_star', { totalMatches }))) awarded++;
  }

  logger.info(`[ACHIEVEMENT] Milestone sweep: ${recentParticipants.length} users scanned, ${awarded} new awards`);
  return { scanned: recentParticipants.length, awarded };
}

async function tryAward(userId, code, context) {
  const result = await awardAchievement({ userId, code, context });
  // tryAward returns true only when a NEW row was created (existing returns the
  // existing row with awardedAt < now-1s). Simple heuristic that's accurate for
  // counting purposes.
  if (!result) return false;
  const age = Date.now() - new Date(result.awardedAt).getTime();
  return age < 60_000;
}
