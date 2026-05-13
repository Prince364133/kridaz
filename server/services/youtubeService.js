import { google } from 'googleapis';
import User from '../models/user.model.js';
import sharp from 'sharp';
import { Readable } from 'stream';

/**
 * Builds an authenticated Google API client for a given user.
 * Handles token refresh automatically.
 */
export async function getYoutubeClientForUser(userId, accountId = null) {
  const user = await User.findById(userId).select('socialAccounts');
  
  let account;
  if (accountId) {
    account = user.socialAccounts.find(acc => acc.platform === 'youtube' && acc.accountId === accountId);
  } else {
    account = user.socialAccounts.find(acc => acc.platform === 'youtube');
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
    expiry_date: account.expiry?.getTime()
  });

  // Auto-refresh logic (simplified for multi-account)
  const expiresAt = account.expiry?.getTime() || 0;
  if (expiresAt < Date.now() + 5 * 60 * 1000 && account.refreshToken) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await User.updateOne(
        { _id: userId, 'socialAccounts.accountId': account.accountId },
        { 
          $set: { 
            'socialAccounts.$.accessToken': credentials.access_token,
            'socialAccounts.$.expiry': new Date(credentials.expiry_date)
          } 
        }
      );
      oauth2Client.setCredentials(credentials);
    } catch (err) {
      console.error("Token refresh failed", err);
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
          title:              title.substring(0, 100),    // YouTube 100 char limit
          description:        (description || '').substring(0, 5000),
          scheduledStartTime: scheduledStartTime
        },
        status: {
          privacyStatus:      privacy || 'public',
          selfDeclaredMadeForKids: false
        },
        contentDetails: {
          enableAutoStart:    true,    // stream starts when OBS connects
          enableAutoStop:     true,    // stream ends when OBS disconnects
          enableDvr:          true,    // allows viewers to rewind live stream
          enableEmbed:        true,    // allow embedding on your platform
          latencyPreference:  'normal' // "ultraLow" | "low" | "normal"
        }
      }
    });

    const broadcast = broadcastResponse.data;
    const broadcastId = broadcast.id;
    const liveChatId = broadcast.snippet.liveChatId;

    // STEP B: Create the ingestion stream (this gives the stream key)
    const streamResponse = await youtube.liveStreams.insert({
      part: ['snippet', 'cdn', 'contentDetails'],
      requestBody: {
        snippet: {
          title: `${title} — Ingestion Stream`
        },
        cdn: {
          frameRate:      resolution === '480p' ? '30fps' : '60fps',
          ingestionType:  'rtmp',
          resolution:     resolution || '1080p'
        },
        contentDetails: {
          isReusable: false    // tied to this specific broadcast
        }
      }
    });

    const stream = streamResponse.data;
    const streamId  = stream.id;
    const rtmpUrl   = stream.cdn.ingestionInfo.ingestionAddress;    // e.g. "rtmps://a.rtmp.youtube.com/live2/"
    const streamKey = stream.cdn.ingestionInfo.streamName;          // the secret key

    // STEP C: Bind broadcast to ingestion stream
    await youtube.liveBroadcasts.bind({
      part: ['id', 'contentDetails'],
      id:       broadcastId,
      streamId: streamId
    });

    // Return everything the UI needs:
    return {
      broadcastId,
      streamId,
      liveChatId,
      youtubeVideoId: broadcastId,   // video ID = broadcast ID for live streams
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

    // Resize to 1280×720 using sharp (if not already that size):
    const resized = await sharp(imageBuffer)
      .resize(1280, 720, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 90 })
      .toBuffer();

    await youtube.thumbnails.set({
      videoId: broadcastId,
      media: {
        mimeType: 'image/jpeg',
        body:     Readable.from(resized)   // Node.js Readable stream
      }
    });

    return { success: true };
  } catch (err) {
    // Thumbnail failure is non-critical — don't fail the whole stream creation
    console.warn('[YouTube] Thumbnail upload failed:', err.message);
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
      // Fetch all statuses to show both upcoming and past:
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
 * This archives it on YouTube as a regular video
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
    // If already complete or not found — don't crash
    console.warn('[YouTube] End broadcast failed:', err.message);
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

    const user = await User.findById(userId);
    if (!user) return;

    user.youtubeChannelId = channel.id;
    user.youtubeChannelName = channel.snippet.title;
    user.youtubeChannelThumb = channel.snippet.thumbnails?.default?.url || null;

    const existingIndex = user.socialAccounts.findIndex(acc => acc.accountId === channel.id && acc.platform === 'youtube');
    const accountData = {
      platform: 'youtube',
      accountId: channel.id,
      accountName: channel.snippet.title,
      accessToken: accessToken,
      thumbnail: channel.snippet.thumbnails?.default?.url || null,
      expiry: new Date(Date.now() + 3600 * 1000)
    };

    if (existingIndex > -1) {
      user.socialAccounts[existingIndex] = { ...user.socialAccounts[existingIndex].toObject(), ...accountData };
    } else {
      user.socialAccounts.push(accountData);
    }

    await user.save();
  } catch (err) {
    console.warn('[YouTube] Could not fetch channel info:', err.message);
  }
}
export async function getChannelStats(userId) {
  try {
    console.log(`[YouTube] Fetching stats for user: ${userId}`);
    const youtube = await getYoutubeClientForUser(userId);
    console.log(`[YouTube] Client created for user: ${userId}`);
    const response = await youtube.channels.list({
      part: ['statistics', 'snippet'],
      mine: true
    });

    const channel = response.data.items?.[0];
    if (!channel) {
      console.warn(`[YouTube] No channel found for user: ${userId}`);
      return null;
    }

    console.log(`[YouTube] Found channel: ${channel.snippet.title} for user: ${userId}`);

    return {
      subscribers: parseInt(channel.statistics.subscriberCount) || 0,
      views: parseInt(channel.statistics.viewCount) || 0,
      videos: parseInt(channel.statistics.videoCount) || 0,
      name: channel.snippet.title,
      thumbnail: channel.snippet.thumbnails?.default?.url || null
    };
  } catch (err) {
    console.warn('[YouTube] Could not fetch live channel stats:', err.message);
    
    // Fallback: Try to get from cached data in User model
    try {
      const user = await User.findById(userId).select('socialAccounts youtubeChannelName youtubeChannelThumb');
      const account = user?.socialAccounts?.find(acc => acc.platform === 'youtube');
      
      if (account || user?.youtubeChannelName) {
        console.log('[YouTube] Returning cached statistics for user:', userId);
        const stats = account?.metadata?.statistics || {};
        return {
          subscribers: parseInt(stats.subscriberCount) || 0,
          views: parseInt(stats.viewCount) || 0,
          videos: parseInt(stats.videoCount) || 0,
          name: account?.accountName || user?.youtubeChannelName || 'YouTube Channel',
          thumbnail: account?.thumbnail || user?.youtubeChannelThumb || null,
          isCached: true
        };
      }
    } catch (fallbackErr) {
      console.error('[YouTube] Fallback stats retrieval failed:', fallbackErr.message);
    }
    
    return null;
  }
}
