import logger from '../utils/logger.js';
import { playerStatsQueue } from '../queues/playerStats.queue.js';
import { normalizeSport, SPORTS } from '../utils/sports.js';

/**
 * Single integration point for the spec's "match-completed event."
 *
 * Call this from every code path that finalizes a match — today that's
 * `scoring.service.finalizeMatch` (cricket via UI + cron auto-finalize).
 * Football / other sports will reuse it when their match-end paths land.
 *
 * Enqueues a `match-completed` job onto playerStatsQueue. The worker handles
 * MatchParticipant inserts, PlayerCareerStats upserts, and XpEvent writes.
 * Idempotent: re-enqueueing the same matchId is safe — the aggregator skips
 * when MatchParticipant rows already exist for that match.
 *
 * Failures here MUST NOT block match finalization. We log and swallow.
 */
export async function emitMatchCompleted(payload) {
  try {
    const { matchId, hostedGameId, sport: rawSport, completedAt, participants } = payload ?? {};
    if (!matchId || !Array.isArray(participants) || participants.length === 0) {
      logger.warn('[MATCH_COMPLETED] Skipping emit — missing matchId or participants:', { matchId, n: participants?.length });
      return;
    }
    const sport = normalizeSport(rawSport) ?? rawSport;

    await playerStatsQueue.add(
      'match-completed',
      { matchId, hostedGameId, sport, completedAt, participants },
      {
        jobId: `match-completed:${matchId}`, // dedupe — re-enqueue is a no-op
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 1000,
      }
    );
  } catch (err) {
    logger.error('[MATCH_COMPLETED] Failed to enqueue match-completed event:', err);
  }
}

/**
 * Build the participants array from a cricket finalize. Pulls one row per
 * userId that appears in playerStats; result is derived from the hostedGame's
 * cricketMatch.result string vs. the user's team_key on their slot.
 *
 * matchScoring — Prisma CricketMatch with playerStats[] included.
 * hostedGame   — Prisma HostedGame with teams.slots included.
 */
export function buildCricketParticipants(matchScoring, hostedGame) {
  if (!matchScoring?.playerStats?.length) return [];

  // Map userId -> teamKey (for win/loss determination).
  const userTeam = new Map();
  for (const team of hostedGame?.teams ?? []) {
    for (const slot of team.slots ?? []) {
      if (slot.userId) userTeam.set(slot.userId, team.teamKey || team.id);
    }
  }

  const winnerKey = inferWinnerTeamKey(matchScoring.result, hostedGame?.teams ?? []);

  // Group per-innings stats into per-user totals.
  const totals = new Map();
  for (const s of matchScoring.playerStats) {
    const u = totals.get(s.userId) ?? {
      userId: s.userId,
      runs: 0, wickets: 0, ballsFaced: 0, minutesPlayed: 0,
    };
    u.runs        += s.battingRuns   ?? 0;
    u.wickets     += s.bowlingWickets ?? 0;
    u.ballsFaced  += s.battingBalls  ?? 0;
    u.minutesPlayed += Math.round((s.timeSpentSeconds ?? 0) / 60);
    totals.set(s.userId, u);
  }

  const participants = [];
  for (const u of totals.values()) {
    const teamKey = userTeam.get(u.userId);
    const result  = !winnerKey ? 'draw' : (teamKey && teamKey === winnerKey ? 'won' : 'lost');
    participants.push({
      userId: u.userId,
      teamId: teamKey ?? null,
      role: null,
      result,
      runs: u.runs,
      wickets: u.wickets,
      minutesPlayed: u.minutesPlayed,
      isMotm: false, // Cricket doesn't flag MOTM on MatchPlayerStat today; populate later if added.
    });
  }
  return participants;
}

// Best-effort: parse "Team A won by N runs" / "...by N wickets" against the
// teams we know about. Returns null when we can't determine a winner (draw,
// tie, abandoned).
function inferWinnerTeamKey(resultString, teams) {
  if (!resultString || !teams?.length) return null;
  const lower = resultString.toLowerCase();
  for (const t of teams) {
    const name = (t.name || '').toLowerCase();
    if (name && lower.includes(`${name} won`)) return t.teamKey || t.id;
  }
  return null;
}

export const KNOWN_SPORTS = SPORTS;
