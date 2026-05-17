import express from 'express';
import multer from 'multer';
import { google } from 'googleapis';
import { prisma } from '../../config/prisma.js';
import verifyAuth from '../../middleware/jwt/auth.middleware.js';
import {
  createYoutubeLiveStream,
  uploadThumbnail,
  listUserBroadcasts,
  updateBroadcast,
  endBroadcast,
  deleteBroadcast
} from '../../services/youtubeService.js';
import { createFacebookLiveStream } from '../../services/facebookService.js';
import { endFacebookLiveStream } from '../../services/facebookService.js';
import crypto from 'crypto';
import logger from "../../utils/logger.js";

const router = express.Router();

const thumbnailUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Thumbnail must be a JPG, PNG, WEBP, or GIF image'), false);
    }
  }
});

/**
 * @swagger
 * tags:
 *   name: SocialStreaming
 *   description: YouTube and Facebook live stream management for matches
 */

/**
 * @swagger
 * /youtube/oauth/start:
 *   get:
 *     summary: Initialize YouTube OAuth flow
 *     tags: [SocialStreaming]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       302:
 *         description: Redirects to Google Auth
 */
router.get('/oauth/start', verifyAuth, (req, res) => {
  const userId = req.user.id;
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI || `${process.env.APP_BASE_URL || 'https://kridaz.com'}/api/youtube/oauth/callback`
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

/**
 * @swagger
 * /youtube/accounts:
 *   get:
 *     summary: List connected YouTube accounts
 *     tags: [SocialStreaming]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of connected channels
 */
router.get('/accounts', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { socialAccounts: true }
    });
    const accounts = Array.isArray(user?.socialAccounts) ? user.socialAccounts : [];
    res.json(accounts.filter(acc => acc.platform === 'youtube'));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /youtube/stream/create:
 *   post:
 *     summary: Create a live stream on YouTube/Facebook
 *     tags: [SocialStreaming]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, matchId, selectedAccounts]
 *             properties:
 *               title: { type: string }
 *               matchId: { type: string }
 *               selectedAccounts: { type: string, description: "JSON string of account IDs" }
 *               thumbnail: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Stream configured with RTMP keys
 */
router.post('/stream/create', verifyAuth, thumbnailUpload.single('thumbnail'), async (req, res) => {
  try {
    const { title, description, scheduledStart, privacy, resolution, matchId } = req.body;
    const userId = req.user.id;

    const [user, existingMatch] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { socialAccounts: true }
      }),
      prisma.hostedGame.findUnique({
        where: { id: matchId },
        include: { broadcasts: true }
      })
    ]);

    if (!existingMatch) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Check if any broadcast is already live or has a stream key
    const activeBroadcast = existingMatch.broadcasts.find(b => b.streamKey || b.status === 'live');
    if (activeBroadcast) {
      return res.status(409).json({
        error:   'stream_exists',
        message: 'This match already has an active stream configured.',
        existing: {
          platform:  activeBroadcast.platform,
          streamKey: activeBroadcast.streamKey,
          rtmpUrl:   activeBroadcast.rtmpUrl,
          watchUrl:  activeBroadcast.watchUrl
        }
      });
    }

    const accounts = Array.isArray(user?.socialAccounts) ? user.socialAccounts : [];
    const selectedAccountIds = req.body.selectedAccounts ? JSON.parse(req.body.selectedAccounts) : [];
    
    if (selectedAccountIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No accounts selected for streaming' });
    }

    const broadcastsToCreate = [];

    for (const accountId of selectedAccountIds) {
      const account = accounts.find(acc => acc.accountId === accountId);
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

          broadcastsToCreate.push({
            platform:    'youtube',
            accountId:   account.accountId,
            accountName: account.accountName,
            broadcastId: ytResult.broadcastId,
            streamId:    ytResult.streamId,
            videoId:     ytResult.youtubeVideoId,
            streamKey:   ytResult.streamKey,
            rtmpUrl:     ytResult.rtmpUrl,
            watchUrl:    ytResult.watchUrl,
            status:      'live'
          });
        } catch (err) {
          logger.error(`YouTube Error for ${account.accountName}:`, err.message);
        }
      }

      if (account.platform === 'facebook') {
        try {
          const fbResult = await createFacebookLiveStream(userId, {
            title,
            description,
            accountId: account.accountId
          });

          broadcastsToCreate.push({
            platform:    'facebook',
            accountId:   account.accountId,
            accountName: account.accountName,
            videoId:     fbResult.broadcastId, // fbResult returns broadcastId as the page live video ID
            streamKey:   fbResult.streamKey,
            rtmpUrl:     fbResult.rtmpUrl,
            watchUrl:    fbResult.watchUrl,
            status:      'live'
          });
        } catch (err) {
          logger.error(`Facebook Error for ${account.accountName}:`, err.message);
        }
      }
    }

    if (broadcastsToCreate.length === 0) {
      return res.status(500).json({ success: false, message: 'Failed to create any broadcasts' });
    }

    const overlayTokenSecret = process.env.OVERLAY_TOKEN_SECRET || 'fallback-secret-for-overlay';
    const overlayToken = crypto
      .createHmac('sha256', overlayTokenSecret)
      .update(matchId.toString())
      .digest('hex');

    // Create broadcasts and update match status in a transaction
    const [updatedMatch] = await prisma.$transaction([
      prisma.hostedGame.update({
        where: { id: matchId },
        data: {
          overlayToken: overlayToken,
          isLive:       true,
          streamStatus: 'live',
          broadcasts: {
            create: broadcastsToCreate
          }
        },
        include: { broadcasts: true }
      })
    ]);

    const frontendUrl = process.env.USER_URL || 'https://kridaz.com';
    res.json({
      success:       true,
      broadcasts:    updatedMatch.broadcasts,
      overlayUrl:    `${frontendUrl}/live-overlay/${matchId}?token=${overlayToken}`,
      scoreboardUrl: `${frontendUrl}/live-score/${matchId}`
    });
  } catch (error) {
    logger.error('YouTube Stream Create Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /youtube/stream/end/{matchId}:
 *   post:
 *     summary: End all live broadcasts for a match
 *     tags: [SocialStreaming]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Stream ended
 */
router.post('/stream/end/:matchId', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const match = await prisma.hostedGame.findUnique({
      where: { id: req.params.matchId },
      include: { broadcasts: true }
    });
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    for (const broadcast of match.broadcasts) {
      if (broadcast.platform === 'youtube' && broadcast.broadcastId) {
        try {
          await endBroadcast(userId, broadcast.broadcastId, broadcast.accountId);
        } catch (err) {
          logger.error(`Failed to end YouTube broadcast ${broadcast.broadcastId}:`, err.message);
        }
      }
      if (broadcast.platform === 'facebook' && broadcast.videoId) {
        try {
          await endFacebookLiveStream(userId, broadcast.videoId, broadcast.accountId);
        } catch (err) {
          logger.error(`Failed to end Facebook broadcast ${broadcast.videoId}:`, err.message);
        }
      }
    }

    // Mark all broadcasts offline and update match status
    await prisma.$transaction([
      prisma.broadcast.updateMany({
        where: { gameId: req.params.matchId },
        data: { status: 'offline' }
      }),
      prisma.hostedGame.update({
        where: { id: req.params.matchId },
        data: {
          isLive:       false,
          streamStatus: 'offline'
        }
      })
    ]);

    res.json({ success: true, message: 'Stream ended successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Other routes (callback, account management, etc.) kept intact for brevity in replacement
// but adding summaries to common ones.

router.get('/oauth/url', verifyAuth, (req, res) => {
  const userId = req.user.id;
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI || `${process.env.APP_BASE_URL || 'https://kridaz.com'}/api/youtube/oauth/callback`
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

router.delete('/account/:accountId', verifyAuth, async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { socialAccounts: true }
    });

    const accounts = Array.isArray(user?.socialAccounts) ? user.socialAccounts : [];
    const updatedAccounts = accounts.filter(
      acc => !(acc.platform === 'youtube' && acc.accountId === accountId)
    );

    await prisma.user.update({
      where: { id: userId },
      data: { socialAccounts: updatedAccounts }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/oauth/callback', async (req, res) => {
  const { code, state: userId } = req.query;

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI || `${process.env.APP_BASE_URL || 'https://kridaz.com'}/api/youtube/oauth/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (tokens.access_token) {
      const oauth2ClientInfo = new google.auth.OAuth2();
      oauth2ClientInfo.setCredentials(tokens);
      const youtube = google.youtube({ version: 'v3', auth: oauth2ClientInfo });

      const channelRes = await youtube.channels.list({
        part: 'snippet,contentDetails,statistics',
        mine: true
      });
      const channelData = channelRes.data.items[0];

      if (channelData) {
        const accountId   = channelData.id;
        const accountName = channelData.snippet.title;
        const thumbnail   = channelData.snippet.thumbnails?.default?.url;

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { socialAccounts: true }
        });

        const existingAccounts = Array.isArray(user?.socialAccounts) ? user.socialAccounts : [];
        const filtered = existingAccounts.filter(
          acc => !(acc.platform === 'youtube' && acc.accountId === accountId)
        );

        filtered.push({
          platform:    'youtube',
          accountId,
          accountName,
          thumbnail,
          accessToken:  tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiry:       new Date(tokens.expiry_date || Date.now() + 3600 * 1000).toISOString(),
          metadata:     { statistics: channelData.statistics }
        });

        await prisma.user.update({
          where: { id: userId },
          data: {
            youtubeChannelId:    accountId,
            youtubeChannelName:  accountName,
            youtubeChannelThumb: thumbnail,
            socialAccounts:      filtered,
            youtubeRefreshToken: tokens.refresh_token
          }
        });
      }
    }

    const frontendUrl = process.env.USER_URL || 'https://kridaz.com';
    res.redirect(`${frontendUrl}/youtube-connected`);
  } catch (error) {
    logger.error('YouTube OAuth Error:', error);
    const frontendUrl = process.env.USER_URL || 'https://kridaz.com';
    res.redirect(`${frontendUrl}/youtube-error`);
  }
});

router.get('/channel', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        youtubeRefreshToken: true,
        youtubeChannelId:    true,
        youtubeChannelName:  true,
        youtubeChannelThumb: true
      }
    });

    if (!user?.youtubeRefreshToken) {
      return res.json({ connected: false });
    }

    res.json({
      connected:       true,
      channelId:       user.youtubeChannelId,
      channelName:     user.youtubeChannelName,
      channelThumb:    user.youtubeChannelThumb,
      youtubeStudioUrl: `https://studio.youtube.com/channel/${user.youtubeChannelId}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/broadcasts', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const broadcasts = await listUserBroadcasts(userId, limit);
    res.json({ success: true, broadcasts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/stream/status/:matchId', verifyAuth, async (req, res) => {
  try {
    const match = await prisma.hostedGame.findUnique({
      where: { id: req.params.matchId },
      include: { broadcasts: true }
    });
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    res.json({
      success:       true,
      isLive:        match.isLive,
      streamStatus:  match.streamStatus,
      overlayActive: !!match.overlayToken,
      broadcasts:    match.broadcasts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/stream/update/:matchId', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, privacy } = req.body;

    const match = await prisma.hostedGame.findUnique({
      where: { id: req.params.matchId },
      include: { 
        broadcasts: {
          where: { platform: 'youtube' },
          take: 1
        }
      }
    });
    
    const youtubeBroadcast = match?.broadcasts[0];
    if (!youtubeBroadcast?.broadcastId) {
      return res.status(404).json({ success: false, message: 'YouTube broadcast not found' });
    }

    await updateBroadcast(userId, youtubeBroadcast.broadcastId, { title, description, privacy });
    res.json({ success: true, message: 'Stream updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/stream/:matchId', verifyAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const match = await prisma.hostedGame.findUnique({
      where: { id: req.params.matchId },
      include: { broadcasts: true }
    });
    
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    for (const broadcast of match.broadcasts) {
      if (broadcast.platform === 'youtube' && broadcast.broadcastId) {
        try {
          await deleteBroadcast(userId, broadcast.broadcastId);
        } catch (err) {
          logger.error(`Failed to delete YouTube broadcast ${broadcast.broadcastId}:`, err.message);
        }
      }
    }

    await prisma.$transaction([
      prisma.broadcast.deleteMany({
        where: { gameId: req.params.matchId }
      }),
      prisma.hostedGame.update({
        where: { id: req.params.matchId },
        data: {
          isLive:       false,
          streamStatus: 'offline',
          overlayToken: null
        }
      })
    ]);

    res.json({ success: true, message: 'Stream deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/thumbnail/:matchId', verifyAuth, thumbnailUpload.single('thumbnail'), async (req, res) => {
  try {
    const userId = req.user.id;
    const match = await prisma.hostedGame.findUnique({
      where: { id: req.params.matchId },
      include: { 
        broadcasts: {
          where: { platform: 'youtube' },
          take: 1
        }
      }
    });
    
    const youtubeBroadcast = match?.broadcasts[0];
    if (!youtubeBroadcast?.broadcastId) {
      return res.status(404).json({ success: false, message: 'YouTube broadcast not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const result = await uploadThumbnail(userId, youtubeBroadcast.broadcastId, req.file.buffer, req.file.mimetype);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
