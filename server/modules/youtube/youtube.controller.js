import { youtubeService } from "../../services/youtubeService.js";
import HostedGame from "../../models/hostedGame.model.js";
import User from "../../models/user.model.js";

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
      await User.findByIdAndUpdate(userId, {
        youtubeAccessToken:  tokens.access_token,
        youtubeRefreshToken: tokens.refresh_token || undefined,
        youtubeTokenExpiry:  tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      });
    }

    res.send("Authentication successful. You can close this window.");
  } catch (error) {
    console.error("[YouTube] oauthCallback error:", error);
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
    const user = await User.findById(userId).select(
      "youtubeAccessToken youtubeRefreshToken youtubeTokenExpiry"
    );

    if (!user?.youtubeAccessToken) {
      return res.status(401).json({
        success: false,
        message: "YouTube not connected. Please reconnect your account.",
      });
    }

    const tokens = {
      access_token:  user.youtubeAccessToken,
      refresh_token: user.youtubeRefreshToken,
      expiry_date:   user.youtubeTokenExpiry?.getTime(),
    };

    // ── Build broadcast ──────────────────────────────────────────────────────
    const match = await HostedGame.findById(matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    const broadcastDetails = {
      title: `${match.gameType} Match - Kridaz Live`,
      description: `Live broadcast of the match between ${match.teams?.teamA?.name || "Team A"} and ${match.teams?.teamB?.name || "Team B"}.`,
      privacyStatus: "unlisted", // Change to public for actual broadcasting
    };

    const streamData = await youtubeService.createBroadcast(tokens, broadcastDetails);

    match.youtubeVideoId = streamData.broadcastId;
    match.streamStatus = "starting";
    await match.save();

    res.json({ success: true, streamData });
  } catch (error) {
    console.error("[YouTube] createLiveStream error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
