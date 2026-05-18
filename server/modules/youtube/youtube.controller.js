import { youtubeService } from "../../services/youtubeService.js";
import { prisma } from "../../config/prisma.js";
import logger from "../../utils/logger.js";

// NOTE: tempTokens was removed — tokens are now persisted in the User document
// so they survive server restarts. The active OAuth flow lives in youtube.routes.js
// which already does this correctly. These controller functions are kept as a
// consistent, DB-backed alternative entry point.

export const getAuthUrl = (req, res) => {
  try {
    const url = youtubeService.getAuthUrl();
    res.json({ success: true, url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * OAuth callback — saves tokens to the User document.
 * Expects req.query.state to carry the userId (set by the OAuth init step).
 * Falls back to req.user?.id for authenticated callback routes.
 */
export const oauthCallback = async (req, res) => {
  const { code } = req.query;

  // The OAuth init step encodes userId in the `state` param so it survives the redirect
  const userId = req.query.state || req.user?.id;

  try {
    const tokens = await youtubeService.getTokens(code);

    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          youtubeAccessToken:  tokens.access_token,
          youtubeRefreshToken: tokens.refresh_token || undefined,
          youtubeTokenExpiry:  tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
          oauth: {
            upsert: {
              create: {
                youtubeAccessToken:  tokens.access_token,
                youtubeRefreshToken: tokens.refresh_token || undefined,
                youtubeTokenExpiry:  tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
              },
              update: {
                youtubeAccessToken:  tokens.access_token,
                youtubeRefreshToken: tokens.refresh_token || undefined,
                youtubeTokenExpiry:  tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
              }
            }
          }
        }
      });
    }

    res.send("Authentication successful. You can close this window.");
  } catch (error) {
    logger.error("[YouTube] oauthCallback error:", error);
    res.status(500).send("Authentication failed.");
  }
};

/**
 * Creates a YouTube live broadcast for the given matchId.
 * Reads tokens from the User document (DB-backed, survives restarts).
 */
export const createLiveStream = async (req, res) => {
  const { matchId } = req.body;

  try {
    // ── Load tokens from DB ──────────────────────────────────────────────────
    const userId = req.user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        youtubeAccessToken: true,
        youtubeRefreshToken: true,
        youtubeTokenExpiry: true,
        oauth: {
          select: {
            youtubeAccessToken: true,
            youtubeRefreshToken: true,
            youtubeTokenExpiry: true
          }
        }
      }
    });

    const oauth = user?.oauth || user;

    if (!user?.youtubeAccessToken) {
      return res.status(401).json({
        success: false,
        message: "YouTube not connected. Please reconnect your account.",
      });
    }

    const tokens = {
      access_token:  oauth.youtubeAccessToken,
      refresh_token: oauth.youtubeRefreshToken,
      expiry_date:   oauth.youtubeTokenExpiry?.getTime(),
    };

    // ── Build broadcast ──────────────────────────────────────────────────────
    const match = await prisma.hostedGame.findUnique({
      where: { id: matchId },
      include: {
        teams: true
      }
    });
    
    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    const teamA = match.teams.find(t => t.teamKey === 'teamA');
    const teamB = match.teams.find(t => t.teamKey === 'teamB');

    const broadcastDetails = {
      title: `${match.gameType} Match - Kridaz Live`,
      description: `Live broadcast of the match between ${teamA?.name || "Team A"} and ${teamB?.name || "Team B"}.`,
      privacyStatus: "unlisted", // Change to public for actual broadcasting
    };

    const streamData = await youtubeService.createBroadcast(tokens, broadcastDetails);

    await prisma.hostedGame.update({
      where: { id: matchId },
      data: {
        youtubeVideoId: streamData.broadcastId,
        streamStatus: "starting"
      }
    });

    res.json({ success: true, streamData });
  } catch (error) {
    logger.error("[YouTube] createLiveStream error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

