import { google } from 'googleapis';
import { prisma } from '../config/prisma.js';
import sharp from 'sharp';
import { Readable } from 'stream';
import logger from "../utils/logger.js";

/**
 * Builds an authenticated Google API client for a given user.
 * Reads socialAccounts JSON from Prisma User and handles token refresh.
 */
export async function getYoutubeClientForUser(userId, accountId = null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { socialAccounts: true }
  });

  if (!user || !user.socialAccounts) {
    throw new Error('User not found or social accounts missing.');
  }

  const accounts = Array.isArray(user.socialAccounts) ? user.socialAccounts : [];

  let account;
  if (accountId) {
    account = accounts.find(acc => acc.platform === 'youtube' && acc.accountId === accountId);
  } else {
    account = accounts.find(acc => acc.platform === 'youtube');
  }

  if (!account?.accessToken) {
    throw new Error('YouTube account not found or not connected.');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.expiry ? new Date(account.expiry).getTime() : undefined
  });

  // Auto-refresh logic for expiring tokens
  const expiresAt = account.expiry ? new Date(account.expiry).getTime() : 0;
  if (expiresAt < Date.now() + 5 * 60 * 1000 && account.refreshToken) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update the specific socialAccount entry via Prisma JSON update
      const updatedAccounts = accounts.map(acc => {
        if (acc.platform === 'youtube' && acc.accountId === account.accountId) {
          return {
            ...acc,
            accessToken: credentials.access_token,
            expiry: new Date(credentials.expiry_date).toISOString()
          };
        }
        return acc;
      });

      await prisma.user.update({
        where: { id: userId },
        data: { socialAccounts: updatedAccounts }
      });

      oauth2Client.setCredentials(credentials);
    } catch (err) {
      logger.error('[YouTube] Token refresh failed:', err.message);
    }
  }

  return google.youtube({ version: 'v3', auth: oauth2Client });
}

/**
 * Creates the YouTube broadcast + ingestion stream + binds them together.
 * Returns everything needed for OBS setup.
 */
export async function createYoutubeLiveStream(userId, {
  title,
  description,
  scheduledStartTime,
  privacy,
  resolution,
  accountId = null
}) {
  const youtube = await getYoutubeClientForUser(userId, accountId);

  try {
    // STEP A: Create the broadcast
    const broadcastResponse = await youtube.liveBroadcasts.insert({
      part: ['snippet', 'status', 'contentDetails'],
      requestBody: {
        snippet: {
          title:              title.substring(0, 100),
          description:        (description || '').substring(0, 5000),
          scheduledStartTime: scheduledStartTime
        },
        status: {
          privacyStatus:      privacy || 'public',
          selfDeclaredMadeForKids: false
        },
        contentDetails: {
          enableAutoStart:   true,
          enableAutoStop:    true,
          enableDvr:         true,
          enableEmbed:       true,
          latencyPreference: 'normal'
        }
      }
    });

    const broadcast = broadcastResponse.data;
    const broadcastId = broadcast.id;
    const liveChatId = broadcast.snippet.liveChatId;

    // STEP B: Create the ingestion stream
    const streamResponse = await youtube.liveStreams.insert({
      part: ['snippet', 'cdn', 'contentDetails'],
      requestBody: {
        snippet: {
          title: `${title} — Ingestion Stream`
        },
        cdn: {
          frameRate:     resolution === '480p' ? '30fps' : '60fps',
          ingestionType: 'rtmp',
          resolution:    resolution || '1080p'
        },
        contentDetails: {
          isReusable: false
        }
      }
    });

    const stream = streamResponse.data;
    const streamId  = stream.id;
    const rtmpUrl   = stream.cdn.ingestionInfo.ingestionAddress;
    const streamKey = stream.cdn.ingestionInfo.streamName;

    // STEP C: Bind broadcast to ingestion stream
    await youtube.liveBroadcasts.bind({
      part: ['id', 'contentDetails'],
      id:       broadcastId,
      streamId: streamId
    });

    return {
      broadcastId,
      streamId,
      liveChatId,
      youtubeVideoId: broadcastId,
      rtmpUrl,
      streamKey,
      watchUrl: `https://www.youtube.com/watch?v=${broadcastId}`,
      embedUrl: `https://www.youtube.com/embed/${broadcastId}`
    };
  } catch (err) {
    if (err?.response?.status === 403 && err?.response?.data?.error?.errors?.[0]?.reason === 'quotaExceeded') {
      throw new Error('YouTube API daily limit reached. Streams can be created again tomorrow. Contact support to increase your limit.');
    }
    throw err;
  }
}

/**
 * Upload thumbnail to YouTube broadcast
 */
export async function uploadThumbnail(userId, broadcastId, imageBuffer, mimeType) {
  try {
    const youtube = await getYoutubeClientForUser(userId);

    const resized = await sharp(imageBuffer)
      .resize(1280, 720, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 90 })
      .toBuffer();

    await youtube.thumbnails.set({
      videoId: broadcastId,
      media: {
        mimeType: 'image/jpeg',
        body:     Readable.from(resized)
      }
    });

    return { success: true };
  } catch (err) {
    logger.warn('[YouTube] Thumbnail upload failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Returns recent broadcasts for the "previous streams" panel
 */
export async function listUserBroadcasts(userId, maxResults = 10) {
  const youtube = await getYoutubeClientForUser(userId);

  try {
    const response = await youtube.liveBroadcasts.list({
      part: ['snippet', 'status', 'contentDetails'],
      mine: true,
      maxResults,
      broadcastStatus: 'all',
      broadcastType:   'all'
    });

    return (response.data.items || []).map(item => ({
      broadcastId:    item.id,
      title:          item.snippet.title,
      description:    item.snippet.description,
      thumbnail:      item.snippet.thumbnails?.medium?.url,
      status:         item.status.lifeCycleStatus,
      privacy:        item.status.privacyStatus,
      scheduledStart: item.snippet.scheduledStartTime,
      actualStart:    item.snippet.actualStartTime,
      actualEnd:      item.snippet.actualEndTime,
      watchUrl:       `https://www.youtube.com/watch?v=${item.id}`,
      concurrentViewers: item.statistics?.concurrentViewers || 0
    }));
  } catch (err) {
    if (err?.response?.status === 403 && err?.response?.data?.error?.errors?.[0]?.reason === 'quotaExceeded') {
      throw new Error('YouTube API daily limit reached.');
    }
    throw err;
  }
}

/**
 * Allows editing title/description/privacy after creation
 */
export async function updateBroadcast(userId, broadcastId, { title, description, privacy }) {
  const youtube = await getYoutubeClientForUser(userId);

  try {
    await youtube.liveBroadcasts.update({
      part: ['snippet', 'status'],
      requestBody: {
        id: broadcastId,
        snippet: { title, description },
        status: { privacyStatus: privacy }
      }
    });
  } catch (err) {
    if (err?.response?.status === 403 && err?.response?.data?.error?.errors?.[0]?.reason === 'quotaExceeded') {
      throw new Error('YouTube API daily limit reached.');
    }
    throw err;
  }
}

/**
 * Transitions the broadcast to "complete" status
 */
export async function endBroadcast(userId, broadcastId, accountId = null) {
  const youtube = await getYoutubeClientForUser(userId, accountId);

  try {
    await youtube.liveBroadcasts.transition({
      part: ['status'],
      broadcastStatus: 'complete',
      id: broadcastId
    });
    return { success: true };
  } catch (err) {
    logger.warn('[YouTube] End broadcast failed:', err.message);
    return { success: false, error: err.message };
  }
}

export async function deleteBroadcast(userId, broadcastId) {
  const youtube = await getYoutubeClientForUser(userId);
  try {
    await youtube.liveBroadcasts.delete({ id: broadcastId });
  } catch (err) {
    if (err?.response?.status === 403 && err?.response?.data?.error?.errors?.[0]?.reason === 'quotaExceeded') {
      throw new Error('YouTube API daily limit reached.');
    }
    throw err;
  }
}

/**
 * Fetches and caches YouTube channel info into User.socialAccounts (Prisma JSON field)
 */
export async function fetchAndStoreYoutubeChannel(userId, accessToken) {
  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const response = await youtube.channels.list({
      part: ['snippet', 'id'],
      mine: true
    });

    const channel = response.data.items?.[0];
    if (!channel) return;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { socialAccounts: true }
    });
    if (!user) return;

    const accounts = Array.isArray(user.socialAccounts) ? user.socialAccounts : [];

    const accountData = {
      platform:    'youtube',
      accountId:   channel.id,
      accountName: channel.snippet.title,
      accessToken: accessToken,
      thumbnail:   channel.snippet.thumbnails?.default?.url || null,
      expiry:      new Date(Date.now() + 3600 * 1000).toISOString()
    };

    const existingIndex = accounts.findIndex(
      acc => acc.accountId === channel.id && acc.platform === 'youtube'
    );

    const updatedAccounts = existingIndex > -1
      ? accounts.map((acc, i) => (i === existingIndex ? { ...acc, ...accountData } : acc))
      : [...accounts, accountData];

    await prisma.user.update({
      where: { id: userId },
      data: {
        youtubeChannelId:    channel.id,
        youtubeChannelName:  channel.snippet.title,
        youtubeChannelThumb: channel.snippet.thumbnails?.default?.url || null,
        socialAccounts:      updatedAccounts
      }
    });
  } catch (err) {
    logger.warn('[YouTube] Could not fetch channel info:', err.message);
  }
}

/**
 * Fetches live channel statistics from YouTube API.
 * Falls back to cached data from Prisma if API call fails.
 */
export async function getChannelStats(userId) {
  try {
    const youtube = await getYoutubeClientForUser(userId);
    const response = await youtube.channels.list({
      part: ['statistics', 'snippet'],
      mine: true
    });

    const channel = response.data.items?.[0];
    if (!channel) return null;

    return {
      subscribers: parseInt(channel.statistics.subscriberCount) || 0,
      views:       parseInt(channel.statistics.viewCount) || 0,
      videos:      parseInt(channel.statistics.videoCount) || 0,
      name:        channel.snippet.title,
      thumbnail:   channel.snippet.thumbnails?.default?.url || null
    };
  } catch (err) {
    logger.warn('[YouTube] Could not fetch live channel stats:', err.message);

    // Fallback: read from Prisma cache
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { socialAccounts: true, youtubeChannelName: true, youtubeChannelThumb: true }
      });

      const accounts = Array.isArray(user?.socialAccounts) ? user.socialAccounts : [];
      const account = accounts.find(acc => acc.platform === 'youtube');

      if (account || user?.youtubeChannelName) {
        const stats = account?.metadata?.statistics || {};
        return {
          subscribers: parseInt(stats.subscriberCount) || 0,
          views:       parseInt(stats.viewCount) || 0,
          videos:      parseInt(stats.videoCount) || 0,
          name:        account?.accountName || user?.youtubeChannelName || 'YouTube Channel',
          thumbnail:   account?.thumbnail || user?.youtubeChannelThumb || null,
          isCached:    true
        };
      }
    } catch (fallbackErr) {
      logger.error('[YouTube] Fallback stats retrieval failed:', fallbackErr.message);
    }

    return null;
  }
}
