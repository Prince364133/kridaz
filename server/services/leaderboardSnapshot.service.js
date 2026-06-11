import { prisma } from "../config/prisma.js";
import { redisClient } from "../config/redis.js";
import { SPORT_LIST } from "../utils/sports.js";
import logger from "../utils/logger.js";

/**
 * Per-sport per-city leaderboard precompute. Writes a JSON blob per
 * (sport, city) tuple plus a sport-only (global) snapshot. Cached for 90
 * minutes — slightly more than the 60-minute schedule cadence so a missed
 * job run does not blank the cache.
 *
 * Cache key: `lb:{sport}:{city||GLOBAL}`
 * Value: JSON array of leaderboard rows, top 100, sorted by playerRating desc
 *        then matchesPlayed desc.
 *
 * Cities are derived from cities that have at least 5 player_career_stats
 * rows for the sport — keeps the snapshot sparse instead of writing rows
 * for every single one-off city string we have in the User table.
 */
const SNAPSHOT_TTL_SECONDS = 90 * 60;
const TOP_N = 100;
const MIN_CITY_PARTICIPANTS = 5;

const cacheKey = (sport, city) => `lb:${sport}:${city || 'GLOBAL'}`;

const buildRows = (rows) =>
  rows.map((r, idx) => ({
    rank: idx + 1,
    user: r.user,
    playerRating: r.playerRating,
    matchesPlayed: r.matchesPlayed,
    matchesWon: r.matchesWon,
    winPercentage: r.winPercentage,
  }));

const snapshotOne = async (sport, cityFilter) => {
  const rows = await prisma.playerCareerStats.findMany({
    where: {
      sportType: sport,
      user: { status: 'active', ...(cityFilter ? { city: cityFilter } : {}) },
    },
    include: {
      user: { select: { id: true, name: true, username: true, profilePicture: true, city: true } },
    },
    orderBy: [
      { playerRating: 'desc' },
      { matchesPlayed: 'desc' },
    ],
    take: TOP_N,
  });
  return buildRows(rows);
};

/**
 * Runs the snapshot for every (sport, top-city) combo plus a global per sport.
 * Returns the count of cache keys written.
 */
export async function snapshotLeaderboards() {
  let written = 0;

  for (const sport of SPORT_LIST) {
    // Discover cities with enough participation in this sport to be worth caching.
    const cityRows = await prisma.playerCareerStats.findMany({
      where: { sportType: sport, user: { city: { not: null } } },
      select: { user: { select: { city: true } } },
    });
    const cityCounts = new Map();
    for (const r of cityRows) {
      const c = r.user?.city?.trim();
      if (!c) continue;
      cityCounts.set(c, (cityCounts.get(c) || 0) + 1);
    }
    const cities = [...cityCounts.entries()]
      .filter(([, n]) => n >= MIN_CITY_PARTICIPANTS)
      .map(([c]) => c);

    // Global (no city filter).
    try {
      const global = await snapshotOne(sport, null);
      await redisClient.setex(cacheKey(sport, null), SNAPSHOT_TTL_SECONDS, JSON.stringify(global));
      written++;
    } catch (err) {
      logger.warn(`[LEADERBOARD] global snapshot failed for ${sport}: ${err.message}`);
    }

    for (const city of cities) {
      try {
        const board = await snapshotOne(sport, city);
        await redisClient.setex(cacheKey(sport, city), SNAPSHOT_TTL_SECONDS, JSON.stringify(board));
        written++;
      } catch (err) {
        logger.warn(`[LEADERBOARD] snapshot failed for ${sport}/${city}: ${err.message}`);
      }
    }
  }

  return written;
}

/**
 * Read-through helper for the GET /leaderboard endpoint.
 * Returns `null` on a cache miss so the controller can fall back to the live
 * query path — keeps the endpoint correct even before the first snapshot.
 */
export async function readLeaderboardCache(sport, city) {
  try {
    const raw = await redisClient.get(cacheKey(sport, city));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    logger.warn(`[LEADERBOARD] cache read failed: ${err.message}`);
    return null;
  }
}
