import { prisma } from '../config/prisma.js';
import logger from '../utils/logger.js';
import { isCanonicalSport } from '../utils/sports.js';
import { computeLevel } from './xp.service.js';

const XP_BASE_MATCH = 50;
const XP_WIN_BONUS  = 20;
const XP_MOTM_BONUS = 30;

/**
 * Idempotent per-match aggregator. Safe to re-run for the same matchId —
 * MatchParticipant rows are uniquely identified by (matchId, userId) at the
 * query layer, and PlayerCareerStats / XpEvent deltas are only applied on
 * first-write (we detect prior aggregation via existing MatchParticipant rows).
 */
export async function processMatchCompleted(event) {
  const { matchId, hostedGameId, sport, completedAt, participants } = event ?? {};

  if (!matchId || !sport || !Array.isArray(participants) || participants.length === 0) {
    logger.warn('[PLAYER_STATS] Dropping malformed match-completed event:', { matchId, sport, n: participants?.length });
    return;
  }
  if (!isCanonicalSport(sport)) {
    logger.warn(`[PLAYER_STATS] Non-canonical sport "${sport}" on match ${matchId} — skipping. Add to utils/sports.js if needed.`);
    return;
  }

  // Already aggregated? Skip — prevents double-counting on cron-driven retries.
  const existing = await prisma.matchParticipant.findFirst({ where: { matchId } });
  if (existing) {
    logger.info(`[PLAYER_STATS] Match ${matchId} already aggregated — skipping`);
    return;
  }

  const playedAt = completedAt ? new Date(completedAt) : new Date();

  for (const p of participants) {
    if (!p?.userId) continue;
    try {
      await aggregateOneParticipant({ matchId, hostedGameId, sport, playedAt, p });
    } catch (err) {
      logger.error(`[PLAYER_STATS] Failed to aggregate user=${p.userId} match=${matchId}:`, err);
    }
  }
}

async function aggregateOneParticipant({ matchId, hostedGameId, sport, playedAt, p }) {
  const xpAwarded =
    XP_BASE_MATCH +
    (p.result === 'won'  ? XP_WIN_BONUS  : 0) +
    (p.isMotm            ? XP_MOTM_BONUS : 0);

  // Load prior career stats once so streak calculation is correct.
  const prior = await prisma.playerCareerStats.findUnique({
    where: { userId_sportType: { userId: p.userId, sportType: sport } },
  });

  const nextStreak  = nextStreakValue(prior?.currentStreak ?? 0, p.result);
  const nextLongest = Math.max(prior?.longestStreak ?? 0, Math.abs(nextStreak));

  const matches = (prior?.matchesPlayed ?? 0) + 1;
  const wins    = (prior?.matchesWon ?? 0)   + (p.result === 'won'  ? 1 : 0);
  const losses  = (prior?.matchesLost ?? 0)  + (p.result === 'lost' ? 1 : 0);
  const draws   = (prior?.matchesDrawn ?? 0) + (p.result === 'draw' ? 1 : 0);
  const winPct  = matches > 0 ? Number(((wins / matches) * 100).toFixed(2)) : 0;

  const hoursPlayedDelta = (Number.isFinite(p.minutesPlayed) ? p.minutesPlayed : 0) / 60;

  // Level recompute is folded into the same transaction so xp/level never
  // diverge. We need the prior xp to compute the next level.
  const userBefore = await prisma.user.findUnique({
    where: { id: p.userId },
    select: { xp: true },
  });
  const newXp = (userBefore?.xp ?? 0) + xpAwarded;
  const newLevel = computeLevel(newXp);

  await prisma.$transaction([
    prisma.matchParticipant.create({
      data: {
        matchId,
        hostedGameId: hostedGameId ?? null,
        userId: p.userId,
        teamId: p.teamId ?? null,
        sport,
        role: p.role ?? null,
        runs: Number.isFinite(p.runs) ? p.runs : null,
        wickets: Number.isFinite(p.wickets) ? p.wickets : null,
        goals: Number.isFinite(p.goals) ? p.goals : null,
        assists: Number.isFinite(p.assists) ? p.assists : null,
        minutesPlayed: Number.isFinite(p.minutesPlayed) ? p.minutesPlayed : null,
        isMotm: !!p.isMotm,
        result: p.result ?? null,
        xpAwarded,
        playedAt,
      },
    }),

    prisma.playerCareerStats.upsert({
      where: { userId_sportType: { userId: p.userId, sportType: sport } },
      create: {
        userId: p.userId,
        sportType: sport,
        matchesPlayed: 1,
        matchesWon:    p.result === 'won'  ? 1 : 0,
        matchesLost:   p.result === 'lost' ? 1 : 0,
        matchesDrawn:  p.result === 'draw' ? 1 : 0,
        winPercentage: winPct,
        goalsScored:   Number.isFinite(p.goals) ? p.goals : 0,
        assistsCount:  Number.isFinite(p.assists) ? p.assists : 0,
        currentStreak: nextStreak,
        longestStreak: nextLongest,
        motmCount:     p.isMotm ? 1 : 0,
        hoursPlayed:   hoursPlayedDelta,
      },
      update: {
        matchesPlayed: matches,
        matchesWon:    wins,
        matchesLost:   losses,
        matchesDrawn:  draws,
        winPercentage: winPct,
        currentStreak: nextStreak,
        longestStreak: nextLongest,
        motmCount:    { increment: p.isMotm ? 1 : 0 },
        goalsScored:  { increment: Number.isFinite(p.goals)   ? p.goals   : 0 },
        assistsCount: { increment: Number.isFinite(p.assists) ? p.assists : 0 },
        hoursPlayed:  { increment: hoursPlayedDelta },
      },
    }),

    prisma.xpEvent.create({
      data: {
        userId: p.userId,
        source: 'match',
        amount: xpAwarded,
        referenceId: matchId,
      },
    }),

    prisma.user.update({
      where: { id: p.userId },
      data: { xp: newXp, level: newLevel },
    }),
  ]);
}

// +n on win streak, -n on loss streak, 0 on draw. Drawing resets the run.
function nextStreakValue(prev, result) {
  if (result === 'won')  return prev >= 0 ? prev + 1 : 1;
  if (result === 'lost') return prev <= 0 ? prev - 1 : -1;
  if (result === 'draw') return 0;
  return prev;
}
