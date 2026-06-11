import { prisma } from '../config/prisma.js';
import logger from '../utils/logger.js';

/**
 * Curve: level = floor(sqrt(xp / 100)) + 1.
 * xp=0 → 1, xp=100 → 2, xp=400 → 3, xp=900 → 4, xp=1600 → 5, ...
 */
export const computeLevel = (xp) => Math.floor(Math.sqrt(Math.max(xp, 0) / 100)) + 1;

const KNOWN_SOURCES = new Set(['match', 'booking', 'review', 'host_game', 'achievement']);

/**
 * Grant XP to a user. Writes an XpEvent row (ledger source of truth),
 * increments User.xp, recomputes User.level. Single transaction so the three
 * stay consistent.
 *
 * `tx` is optional — when called from within an existing $transaction, pass
 * the tx client so the work joins the outer commit. Without `tx` it starts
 * its own transaction.
 *
 * Returns the post-grant snapshot { xp, level, leveledUp }.
 */
export async function grantXp({ userId, source, amount, referenceId = null, tx = null }) {
  if (!userId || !Number.isFinite(amount) || amount <= 0) return null;
  if (!KNOWN_SOURCES.has(source)) {
    logger.warn(`[XP] Unknown source "${source}" — recording anyway`);
  }

  const run = async (client) => {
    await client.xpEvent.create({
      data: { userId, source, amount, referenceId },
    });
    const prior = await client.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    });
    if (!prior) return null;

    const newXp = (prior.xp ?? 0) + amount;
    const newLevel = computeLevel(newXp);
    const leveledUp = newLevel > (prior.level ?? 1);

    await client.user.update({
      where: { id: userId },
      data: { xp: newXp, level: newLevel },
    });
    return { xp: newXp, level: newLevel, leveledUp };
  };

  try {
    return tx ? await run(tx) : await prisma.$transaction(run);
  } catch (err) {
    logger.error(`[XP] grantXp failed user=${userId} source=${source} amount=${amount}:`, err);
    return null;
  }
}
