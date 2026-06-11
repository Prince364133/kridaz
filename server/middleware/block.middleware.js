import { prisma } from "../config/prisma.js";
import logger from "../utils/logger.js";

const resolveTargetId = async (rawId) => {
  if (!rawId) return null;
  const idStr = rawId.toString();
  try {
    const owner = await prisma.ownerProfile.findUnique({
      where: { id: idStr },
      select: { userId: true },
    });
    return owner?.userId || idStr;
  } catch {
    return idStr;
  }
};

const resolveViewerId = async (rawId) => {
  if (!rawId) return null;
  return resolveTargetId(rawId);
};

/**
 * Bidirectional block check for `/player/:id/*` style routes.
 *
 * Returns 404 (not 403) when a block is in effect — leaking "this user blocked
 * you" is a UX/safety regression, so we mirror what the user would see if the
 * profile simply did not exist. Self-views always pass through.
 *
 * Requires `req.params.id`. If the route is unauthenticated, no check runs
 * (anonymous viewers can't be the target of a personal block).
 */
export const blockCheck = async (req, res, next) => {
  try {
    const rawTarget = req.params.id;
    if (!rawTarget) return next();

    const viewerRaw = req.user?.id || req.owner?.id;
    if (!viewerRaw) return next();

    const [targetUserId, viewerUserId] = await Promise.all([
      resolveTargetId(rawTarget),
      resolveViewerId(viewerRaw),
    ]);

    if (!targetUserId || !viewerUserId) return next();
    if (targetUserId === viewerUserId) return next();

    const block = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId: targetUserId, blockedId: viewerUserId },
          { blockerId: viewerUserId, blockedId: targetUserId },
        ],
      },
      select: { blockerId: true },
    });

    if (block) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return next();
  } catch (err) {
    logger.error("blockCheck middleware error:", err);
    return next();
  }
};

export default blockCheck;
