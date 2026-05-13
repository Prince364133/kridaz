import axios from 'axios';
import User from '../../models/user.model.js';

/**
 * Creates a Facebook Live Video broadcast for a specific page.
 * @param {string} userId - The user ID who owns the connection.
 * @param {object} options - Stream details (title, description, accountId).
 * @returns {object} - Object containing rtmpUrl, streamKey, and broadcastId.
 */
export const createFacebookLiveStream = async (userId, options) => {
  const { title, description, accountId } = options;
  
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const account = user.socialAccounts.find(acc => acc.accountId === accountId && acc.platform === 'facebook');
  if (!account) throw new Error("Facebook account/page not found for this user");

  const pageAccessToken = account.accessToken;
  const pageId = account.accountId;

  try {
    // 1. Create Live Video object
    // API: POST /{page_id}/live_videos
    const response = await axios.post(`https://graph.facebook.com/v25.0/${pageId}/live_videos`, {
      title,
      description,
      status: 'LIVE_NOW', // Or just create it, and it will be in 'UNPUBLISHED'
      access_token: pageAccessToken
    });

    const { stream_url, secure_stream_url, id: broadcastId } = response.data;

    // Secure stream url usually looks like: rtmps://live-api-s.facebook.com:443/rtmp/KEY
    // We need to split it for some encoders, but usually the whole thing is the RTMP URL
    // Actually, secure_stream_url includes both.
    
    // Facebook secure_stream_url format: rtmps://live-api-s.facebook.com:443/rtmp/123456789?s_bl=1&s_sc=123...
    // The part before the last slash is the Server URL, the part after is the Key.
    
    const urlParts = secure_stream_url.lastIndexOf('/');
    const rtmpUrl = secure_stream_url.substring(0, urlParts);
    const streamKey = secure_stream_url.substring(urlParts + 1);

    return {
      broadcastId,
      rtmpUrl,
      streamKey,
      watchUrl: `https://www.facebook.com/${broadcastId}`
    };

  } catch (error) {
    console.error("Facebook Stream Creation Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to create Facebook live stream");
  }
};
