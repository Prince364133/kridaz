import { prisma } from "../../config/prisma.js";
import logger from "../../utils/logger.js";
import generateQRCode from "../../utils/generateQRCode.js";

/**
 * Team Domain Service
 * Handles business logic for teams, squads, and challenges.
 */

/**
 * Generates a unique 10-character alphanumeric team code
 */
export const generateTeamCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Ensures uniqueness of the generated team code
 */
export const createUniqueTeamCode = async () => {
  let code;
  let attempts = 0;
  do {
    code = generateTeamCode();
    attempts++;
    if (attempts > 10) throw new Error("Failed to generate unique team code");
  } while (await prisma.team.findUnique({ where: { teamCode: code } }));
  return code;
};

/**
 * Get team by ID with full relations
 */
export const getTeamWithDetails = async (id) => {
  return await prisma.team.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, name: true, avatar: true, username: true }
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, avatar: true, sportType: true }
          }
        }
      },
      opponents: true,
      opponentRequestsReceived: {
        include: {
          from: {
            select: { id: true, name: true, image: true, logo: true, teamCode: true }
          }
        }
      }
    }
  });
};

/**
 * Generate and save team QR code
 */
export const ensureTeamQRCode = async (teamId) => {
  const frontendUrl = process.env.USER_URL || process.env.CLIENT_URLS?.split(",")[0] || "https://kridaz.com";
  const qrUrl = `${frontendUrl}/team-pass/${teamId}`;
  
  try {
    const qrCodeUrl = await generateQRCode(qrUrl);
    return await prisma.team.update({
      where: { id: teamId },
      data: { qrCode: qrCodeUrl }
    });
  } catch (error) {
    logger.error("QR Generation failed in service:", error);
    return null;
  }
};
