import { prisma } from '../config/prisma.js';
import logger from '../utils/logger.js';

const TOP_TAG_LIMIT = 5;

/**
 * Rebuild the PlayerReviewAggregate row for a single user. Cheap — one
 * groupBy + a small aggregation. Called incrementally from the review-submit
 * handler so the profile card stays fresh without a cron in Phase 3.
 *
 * If volume ever makes per-write recompute too noisy, swap this for a
 * batched cron (`rebuildReviewAggregates` per spec section 5) — the function
 * stays the same, only the call site changes.
 */
export async function rebuildAggregateForUser(userId) {
  if (!userId) return;
  try {
    const reviews = await prisma.playerReview.findMany({
      where: { revieweeId: userId },
      select: { sportsmanship: true, punctuality: true, skill: true, tags: true },
    });

    if (reviews.length === 0) {
      await prisma.playerReviewAggregate.upsert({
        where: { userId },
        create: { userId, reviewCount: 0, topTags: [] },
        update: { avgSportsmanship: null, avgPunctuality: null, avgSkill: null, reviewCount: 0, topTags: [] },
      });
      return;
    }

    let sportsmanshipSum = 0, punctualitySum = 0, skillSum = 0;
    const tagCounts = new Map();
    for (const r of reviews) {
      sportsmanshipSum += r.sportsmanship;
      punctualitySum   += r.punctuality;
      skillSum         += r.skill;
      for (const t of r.tags ?? []) {
        if (!t) continue;
        tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      }
    }

    const n = reviews.length;
    const avg = (sum) => Number((sum / n).toFixed(2));
    const topTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_TAG_LIMIT)
      .map(([tag, count]) => ({ tag, count }));

    await prisma.playerReviewAggregate.upsert({
      where: { userId },
      create: {
        userId,
        avgSportsmanship: avg(sportsmanshipSum),
        avgPunctuality:   avg(punctualitySum),
        avgSkill:         avg(skillSum),
        reviewCount:      n,
        topTags,
      },
      update: {
        avgSportsmanship: avg(sportsmanshipSum),
        avgPunctuality:   avg(punctualitySum),
        avgSkill:         avg(skillSum),
        reviewCount:      n,
        topTags,
      },
    });
  } catch (err) {
    logger.error(`[REVIEW_AGG] Failed to rebuild aggregate for ${userId}:`, err);
  }
}
