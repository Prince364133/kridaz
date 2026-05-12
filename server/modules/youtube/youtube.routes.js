import express from 'express';
import multer from 'multer';
import { google } from 'googleapis';
import User from '../../models/user.model.js';
import HostedGame from '../../models/hostedGame.model.js';
import verifyAuth from '../../middleware/jwt/auth.middleware.js';
import { 
  createYoutubeLiveStream, 
  uploadThumbnail, 
  listUserBroadcasts, 
  updateBroadcast, 
  endBroadcast, 
  deleteBroadcast,
  fetchAndStoreYoutubeChannel
} from '../../services/youtubeService.js';
import crypto from 'crypto';

const router = express.Router();

const thumbnailUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Thumbnail must be a JPG, PNG, WEBP, or GIF image'), false);
    }
  }
});

// OAuth Initialization
router.get('/oauth/start', verifyAuth, (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI || `${process.env.APP_BASE_URL || 'http://localhost:5000'}/api/youtube/oauth/callback`
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload'
    ],
    state: req.user._id // Pass user ID through state to link the callback
  });

  res.json({ url });
});

// OAuth Callback
router.get('/oauth/callback', async (req, res) => {
  const { code, state: userId } = req.query;

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI || `${process.env.APP_BASE_URL || 'http://localhost:5000'}/api/youtube/oauth/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    if (tokens.access_token) {
      const user = await User.findById(userId);
      await User.findByIdAndUpdate(userId, {
        youtubeAccessToken:  tokens.access_token,
        youtubeRefreshToken: tokens.refresh_token || user?.youtubeRefreshToken,
        youtubeTokenExpiry:  new Date(tokens.expiry_date || Date.now() + 3600 * 1000)
      });

      await fetchAndStoreYoutubeChannel(userId, tokens.access_token);
    }

    // Redirect to frontend setup page (pass a success flag)
    res.redirect(`${process.env.VITE_APP_URL || 'http://localhost:5173'}/youtube-connected`);
  } catch (error) {
    console.error('YouTube OAuth Error:', error);
    res.redirect(`${process.env.VITE_APP_URL || 'http://localhost:5173'}/youtube-error`);
  }
});

// Get Channel Info
router.get('/channel', verifyAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.youtubeRefreshToken) {
      return res.json({ connected: false });
    }
    res.json({
      connected: true,
      channelId: user.youtubeChannelId,
      channelName: user.youtubeChannelName,
      channelThumb: user.youtubeChannelThumb,
      youtubeStudioUrl: `https://studio.youtube.com/channel/${user.youtubeChannelId}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create Stream
router.post('/stream/create', verifyAuth, thumbnailUpload.single('thumbnail'), async (req, res) => {
  try {
    const { title, description, scheduledStart, privacy, resolution, matchId } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user.youtubeRefreshToken) {
      return res.status(401).json({
        error: 'youtube_not_connected',
        message: 'Please connect your YouTube channel first.',
        action: 'Connect YouTube',
        actionUrl: '/api/youtube/oauth/start'
      });
    }

    const existingMatch = await HostedGame.findById(matchId);
    if (!existingMatch) {
        return res.status(404).json({ success: false, message: 'Match not found' });
    }

    if (existingMatch.youtubeStreamKey) {
      return res.status(409).json({
        error: 'stream_exists',
        message: 'This match already has a YouTube stream configured.',
        existing: {
          streamKey: existingMatch.youtubeStreamKey,
          rtmpUrl:   existingMatch.youtubeRtmpUrl,
          watchUrl:  `https://youtube.com/watch?v=${existingMatch.youtubeVideoId}`
        }
      });
    }

    const result = await createYoutubeLiveStream(userId, {
      title,
      description,
      scheduledStartTime: scheduledStart,
      privacy,
      resolution
    });

    let thumbnailUploaded = false;
    if (req.file) {
      const thumbResult = await uploadThumbnail(userId, result.broadcastId, req.file.buffer, req.file.mimetype);
      thumbnailUploaded = thumbResult.success;
    }

    const overlayTokenSecret = process.env.OVERLAY_TOKEN_SECRET || 'fallback-secret-for-overlay';
    const overlayToken = crypto.createHmac('sha256', overlayTokenSecret)
                               .update(matchId.toString())
                               .digest('hex');

    await HostedGame.findByIdAndUpdate(matchId, {
      youtubeBroadcastId: result.broadcastId,
      youtubeStreamId:    result.streamId,
      youtubeVideoId:     result.youtubeVideoId,
      youtubeLiveChatId:  result.liveChatId,
      youtubeStreamKey:   result.streamKey,
      youtubeRtmpUrl:     result.rtmpUrl,
      overlayToken:       overlayToken,
      isLive:             true,
      streamStatus:       'starting'
    });

    res.json({
      success: true,
      broadcastId: result.broadcastId,
      rtmpUrl: result.rtmpUrl,
      streamKey: result.streamKey,
      watchUrl: result.watchUrl,
      overlayUrl: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/live-overlay/${matchId}?token=${overlayToken}`,
      scoreboardUrl: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/live-score/${matchId}`,
      thumbnailUploaded
    });

  } catch (error) {
    console.error('YouTube Stream Create Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// List Broadcasts
router.get('/broadcasts', verifyAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const broadcasts = await listUserBroadcasts(req.user._id, limit);
    res.json({ success: true, broadcasts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Stream Status
router.get('/stream/status/:matchId', verifyAuth, async (req, res) => {
  try {
    const match = await HostedGame.findById(req.params.matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    
    res.json({
      success: true,
      isLive: match.isLive,
      streamStatus: match.streamStatus,
      overlayActive: match.overlayToken ? true : false,
      youtubeVideoId: match.youtubeVideoId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// End Stream
router.post('/stream/end/:matchId', verifyAuth, async (req, res) => {
  try {
    const match = await HostedGame.findById(req.params.matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    if (match.youtubeBroadcastId) {
      await endBroadcast(req.user._id, match.youtubeBroadcastId);
    }

    await HostedGame.findByIdAndUpdate(req.params.matchId, {
      isLive: false,
      streamStatus: 'offline'
    });

    res.json({ success: true, message: 'Stream ended successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Stream
router.patch('/stream/update/:matchId', verifyAuth, async (req, res) => {
  try {
    const { title, description, privacy } = req.body;
    const match = await HostedGame.findById(req.params.matchId);
    if (!match || !match.youtubeBroadcastId) {
      return res.status(404).json({ success: false, message: 'Broadcast not found' });
    }

    await updateBroadcast(req.user._id, match.youtubeBroadcastId, { title, description, privacy });
    res.json({ success: true, message: 'Stream updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Stream
router.delete('/stream/:matchId', verifyAuth, async (req, res) => {
  try {
    const match = await HostedGame.findById(req.params.matchId);
    if (!match || !match.youtubeBroadcastId) {
      return res.status(404).json({ success: false, message: 'Broadcast not found' });
    }

    await deleteBroadcast(req.user._id, match.youtubeBroadcastId);
    
    await HostedGame.findByIdAndUpdate(req.params.matchId, {
      $unset: {
        youtubeBroadcastId: 1,
        youtubeStreamId: 1,
        youtubeVideoId: 1,
        youtubeLiveChatId: 1,
        youtubeStreamKey: 1,
        youtubeRtmpUrl: 1,
        overlayToken: 1
      }
    });

    res.json({ success: true, message: 'Stream deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload Thumbnail
router.post('/thumbnail/:matchId', verifyAuth, thumbnailUpload.single('thumbnail'), async (req, res) => {
  try {
    const match = await HostedGame.findById(req.params.matchId);
    if (!match || !match.youtubeBroadcastId) {
      return res.status(404).json({ success: false, message: 'Broadcast not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const result = await uploadThumbnail(req.user._id, match.youtubeBroadcastId, req.file.buffer, req.file.mimetype);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
