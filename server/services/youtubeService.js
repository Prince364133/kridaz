import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI || `${process.env.APP_BASE_URL}/api/youtube/callback`
);

export const youtubeService = {
  /**
   * Get the authentication URL for the user to grant permissions.
   */
  getAuthUrl: () => {
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/youtube.force-ssl'],
      prompt: 'consent'
    });
  },

  /**
   * Exchange the authorization code for tokens.
   */
  getTokens: async (code) => {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  },

  /**
   * Create a new YouTube Live Broadcast.
   * @param {Object} tokens - OAuth tokens
   * @param {Object} broadcastDetails - title, description, privacyStatus
   */
  createBroadcast: async (tokens, broadcastDetails) => {
    oauth2Client.setCredentials(tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // 1. Create the broadcast
    const broadcastResponse = await youtube.liveBroadcasts.insert({
      part: 'snippet,status,contentDetails',
      requestBody: {
        snippet: {
          title: broadcastDetails.title || 'Live Cricket Match',
          description: broadcastDetails.description || 'Watch live cricket action!',
          scheduledStartTime: new Date().toISOString(),
        },
        status: {
          privacyStatus: broadcastDetails.privacyStatus || 'unlisted', // 'public', 'private', or 'unlisted'
          selfDeclaredMadeForKids: false,
        },
        contentDetails: {
          enableAutoStart: true,
          enableAutoStop: true,
          monitorStream: { enableMonitorStream: false }
        }
      }
    });

    const broadcast = broadcastResponse.data;

    // 2. Create the stream
    const streamResponse = await youtube.liveStreams.insert({
      part: 'snippet,cdn',
      requestBody: {
        snippet: {
          title: `Stream for ${broadcastDetails.title || 'Match'}`,
        },
        cdn: {
          frameRate: '60fps',
          ingestionType: 'rtmp',
          resolution: '1080p'
        }
      }
    });

    const stream = streamResponse.data;

    // 3. Bind the broadcast to the stream
    await youtube.liveBroadcasts.bind({
      part: 'id,contentDetails',
      id: broadcast.id,
      streamId: stream.id
    });

    return {
      broadcastId: broadcast.id,
      streamId: stream.id,
      rtmpUrl: stream.cdn.ingestionInfo.ingestionAddress,
      streamKey: stream.cdn.ingestionInfo.streamName,
      videoUrl: `https://www.youtube.com/watch?v=${broadcast.id}`
    };
  },

  /**
   * Get the status of an existing broadcast.
   */
  getBroadcastStatus: async (tokens, broadcastId) => {
    oauth2Client.setCredentials(tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const response = await youtube.liveBroadcasts.list({
      part: 'status',
      id: broadcastId
    });

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].status.lifeCycleStatus; // 'ready', 'testing', 'live', 'complete'
    }
    return null;
  }
};
