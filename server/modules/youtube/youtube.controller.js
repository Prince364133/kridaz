import { youtubeService } from "../../services/youtubeService.js";
import HostedGame from "../../models/hostedGame.model.js";

// Store tokens temporarily (in production, store in DB associated with the user/admin)
let tempTokens = null;

export const getAuthUrl = (req, res) => {
  try {
    const url = youtubeService.getAuthUrl();
    res.json({ success: true, url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const oauthCallback = async (req, res) => {
  const { code } = req.query;
  try {
    const tokens = await youtubeService.getTokens(code);
    tempTokens = tokens;
    // In a real app, you would redirect back to the frontend with a success message
    res.send("Authentication successful. You can close this window.");
  } catch (error) {
    res.status(500).send("Authentication failed.");
  }
};

export const createLiveStream = async (req, res) => {
  const { matchId } = req.body;
  try {
    if (!tempTokens) {
      return res.status(401).json({ success: false, message: "YouTube not authenticated." });
    }

    const match = await HostedGame.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: "Match not found" });

    const broadcastDetails = {
      title: `${match.gameType} Match - Kridaz Live`,
      description: `Live broadcast of the match between ${match.teams?.teamA?.name || 'Team A'} and ${match.teams?.teamB?.name || 'Team B'}.`,
      privacyStatus: 'unlisted' // Change to public for actual broadcasting
    };

    const streamData = await youtubeService.createBroadcast(tempTokens, broadcastDetails);

    match.youtubeVideoId = streamData.broadcastId;
    match.streamStatus = 'starting';
    await match.save();

    res.json({ success: true, streamData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
