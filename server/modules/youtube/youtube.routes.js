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
import { createFacebookLiveStream, endFacebookLiveStream } from '../../services/facebookService.js';
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
  const userId = req.user.id || req.user.user;
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI || `${process.env.APP_BASE_URL || 'http://localhost:6001'}/api/youtube/oauth/callback`
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload'
    ],
    state: userId.toString()
  });

  if (req.headers.accept?.includes('application/json')) {
    return res.json({ url });
  }
  res.redirect(url);
});

router.get('/oauth/url', verifyAuth, (req, res) => {
  const userId = req.user.id || req.user.user;
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI || `${process.env.APP_BASE_URL || 'http://localhost:6001'}/api/youtube/oauth/callback`
  );
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload'
    ],
    state: userId.toString()
  });
  res.json({ url });
});

router.get('/accounts', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id || req.user.user;
    const user = await User.findById(userId).select('socialAccounts');
    const accounts = user.socialAccounts.filter(acc => acc.platform === 'youtube');
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/account/:accountId', verifyAuth, async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.id || req.user.user;
    await User.findByIdAndUpdate(userId, {
      $pull: { socialAccounts: { platform: 'youtube', accountId } }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// OAuth Callback
router.get('/oauth/callback', async (req, res) => {
  const { code, state: userId } = req.query;

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI || `${process.env.APP_BASE_URL || 'http://localhost:6001'}/api/youtube/oauth/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    if (tokens.access_token) {
      // Fetch channel info first to get unique ID
      const oauth2ClientInfo = new google.auth.OAuth2();
      oauth2ClientInfo.setCredentials(tokens);
      const youtube = google.youtube({ version: 'v3', auth: oauth2ClientInfo });
      const channelRes = await youtube.channels.list({
        part: 'snippet,contentDetails,statistics',
        mine: true
      });
      const channelData = channelRes.data.items[0];

      if (channelData) {
        const accountId = channelData.id;
        const accountName = channelData.snippet.title;
        const thumbnail = channelData.snippet.thumbnails?.default?.url;

        await User.findByIdAndUpdate(userId, {
          $pull: { socialAccounts: { platform: 'youtube', accountId } }
        });

        const updateData = {
          youtubeChannelId: accountId,
          youtubeChannelName: accountName,
          youtubeChannelThumb: thumbnail,
          $push: {
            socialAccounts: {
              platform: 'youtube',
              accountId,
              accountName,
              thumbnail,
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              expiry: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
              metadata: {
                statistics: channelData.statistics
              }
            }
          }
        };

        await User.findByIdAndUpdate(userId, updateData);
      }
    }

    // Redirect to frontend setup page (pass a success flag)
    const frontendUrl = process.env.VITE_APP_URL || process.env.APP_FRONTEND_URL || 'http://localhost:5174';
    res.redirect(`${frontendUrl}/youtube-connected`);
  } catch (error) {
    console.error('YouTube OAuth Error:', error);
    const frontendUrl = process.env.VITE_APP_URL || process.env.APP_FRONTEND_URL || 'http://localhost:5174';
    res.redirect(`${frontendUrl}/youtube-error`);
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
    const userId = req.user.id || req.user.user;
    const user = await User.findById(userId);
    
    const hasYouTube = user.socialAccounts.some(acc => acc.platform === 'youtube');
    const hasFacebook = user.socialAccounts.some(acc => acc.platform === 'facebook');
    
    if (!hasYouTube && !hasFacebook) {
      return res.status(401).json({
        error: 'no_social_connected',
        message: 'Please connect your YouTube or Facebook account first.',
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

    const selectedAccounts = req.body.selectedAccounts ? JSON.parse(req.body.selectedAccounts) : [];
    
    if (selectedAccounts.length === 0) {
      return res.status(400).json({ success: false, message: 'No accounts selected for streaming' });
    }

    const broadcastsResults = [];

    for (const accountId of selectedAccounts) {
      const account = user.socialAccounts.find(acc => acc.accountId === accountId);
      if (!account) continue;

      if (account.platform === 'youtube') {
        try {
          const ytResult = await createYoutubeLiveStream(userId, {
            title,
            description,
            scheduledStartTime: scheduledStart,
            privacy,
            resolution,
            accountId: account.accountId
          });

          if (req.file) {
            await uploadThumbnail(userId, ytResult.broadcastId, req.file.buffer, req.file.mimetype);
          }

          broadcastsResults.push({
            platform: 'youtube',
            accountId: account.accountId,
            accountName: account.accountName,
            broadcastId: ytResult.broadcastId,
            streamId: ytResult.streamId,
            videoId: ytResult.youtubeVideoId,
            streamKey: ytResult.streamKey,
            rtmpUrl: ytResult.rtmpUrl,
            watchUrl: ytResult.watchUrl,
            status: 'live'
          });
        } catch (err) {
          console.error(`YouTube Error for ${account.accountName}:`, err.message);
        }
      }

      if (account.platform === 'facebook') {
        try {
          const fbResult = await createFacebookLiveStream(userId, { 
            title, 
            description,
            accountId: account.accountId 
          });

          broadcastsResults.push({
            platform: 'facebook',
            accountId: account.accountId,
            accountName: account.accountName,
            videoId: fbResult.id,
            streamKey: fbResult.streamKey,
            rtmpUrl: fbResult.rtmpUrl,
            watchUrl: fbResult.watchUrl,
            status: 'live'
          });
        } catch (err) {
          console.error(`Facebook Error for ${account.accountName}:`, err.message);
        }
      }
    }

    if (broadcastsResults.length === 0) {
      return res.status(500).json({ success: false, message: 'Failed to create any broadcasts' });
    }

    const overlayTokenSecret = process.env.OVERLAY_TOKEN_SECRET || 'fallback-secret-for-overlay';
    const overlayToken = crypto.createHmac('sha256', overlayTokenSecret)
                               .update(matchId.toString())
                               .digest('hex');

    const updateData = {
      overlayToken:       overlayToken,
      isLive:             true,
      streamStatus:       'live',
      broadcasts:         broadcastsResults
    };

    const updatedMatch = await HostedGame.findByIdAndUpdate(matchId, updateData, { new: true });

    const frontendUrl = process.env.VITE_APP_URL || process.env.APP_FRONTEND_URL || 'http://localhost:5173';
    res.json({
      success: true,
      broadcasts: broadcastsResults,
      overlayUrl: `${frontendUrl}/live-overlay/${matchId}?token=${overlayToken}`,
      scoreboardUrl: `${frontendUrl}/live-score/${matchId}`,
      streamConfig: updatedMatch
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

    if (match.broadcasts && match.broadcasts.length > 0) {
      for (const broadcast of match.broadcasts) {
        if (broadcast.platform === 'youtube' && broadcast.broadcastId) {
          try {
            await endBroadcast(req.user._id, broadcast.broadcastId, broadcast.accountId);
          } catch (err) {
            console.error(`Failed to end YouTube broadcast ${broadcast.broadcastId}:`, err.message);
          }
        }
        if (broadcast.platform === 'facebook' && broadcast.videoId) {
          try {
            await endFacebookLiveStream(req.user._id, broadcast.videoId, broadcast.accountId);
          } catch (err) {
            console.error(`Failed to end Facebook broadcast ${broadcast.videoId}:`, err.message);
          }
        }
      }
    }

    await HostedGame.findByIdAndUpdate(req.params.matchId, {
      isLive: false,
      streamStatus: 'offline',
      'broadcasts.$[].status': 'offline'
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
