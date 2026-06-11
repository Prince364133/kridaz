import { prisma } from "../config/prisma.js";

/**
 * Decides whether `senderUserId` may DM `targetUserId`.
 *
 * Two rails:
 *   1. Bidirectional block — either side blocking the other denies.
 *   2. `privacyFlags.allowDM = false` denies UNLESS the target already
 *      follows the sender (target opted in by following).
 *
 * Owners DM-ing as the business account skip the allowDM gate — owners
 * messaging their customer base is a business flow, not a personal DM.
 * Blocks still apply.
 *
 * Returns `{ ok: true }` or `{ ok: false, code, status, message }`.
 * `code` is stable for clients to localize; `status` is the HTTP code to send.
 */
export async function canDirectMessage({ senderUserId, targetUserId, senderIsOwner = false }) {
  if (!senderUserId || !targetUserId) return { ok: true };
  if (senderUserId === targetUserId) return { ok: true };

  const block = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: senderUserId, blockedId: targetUserId },
        { blockerId: targetUserId, blockedId: senderUserId },
      ],
    },
    select: { blockerId: true },
  });
  if (block) {
    return {
      ok: false,
      status: 403,
      code: 'DM_BLOCKED',
      message: 'You cannot message this user.',
    };
  }

  if (senderIsOwner) return { ok: true };

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { privacyFlags: true },
  });
  const allowDM = target?.privacyFlags?.allowDM !== false;
  if (allowDM) return { ok: true };

  // allowDM is false; permit only if target already follows sender.
  const targetFollowsSender = await prisma.userRelationship.findFirst({
    where: { userId: targetUserId, targetId: senderUserId },
    select: { id: true },
  });
  if (targetFollowsSender) return { ok: true };

  return {
    ok: false,
    status: 403,
    code: 'DM_NOT_ALLOWED',
    message: 'This user only accepts messages from people they follow.',
  };
}

export default canDirectMessage;
