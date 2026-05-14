import axios from 'axios';
import User from '../models/user.model.js';

export async function getFacebookPageStats(userId, accountId = null) {
  const user = await User.findById(userId).select('socialAccounts');
  if (!user || !user.socialAccounts) return null;
  
  let account;
  if (accountId) {
    account = user.socialAccounts.find(acc => acc.platform === 'facebook' && acc.accountId === accountId);
  } else {
    account = user.socialAccounts.find(acc => acc.platform === 'facebook');
  }

  if (!account?.accessToken || !account?.accountId) {
    return null;
  }

  try {
    const response = await axios.get(`https://graph.facebook.com/v25.0/${account.accountId}`, {
      params: {
        fields: 'followers_count,fan_count,name,picture',
        access_token: account.accessToken
      }
    });

    const data = response.data;
    return {
      followers: data.followers_count || 0,
      likes: data.fan_count || 0,
      name: data.name,
      thumbnail: data.picture?.data?.url || null
    };
  } catch (err) {
    console.warn('[Facebook] Could not fetch live page stats:', err.response?.data || err.message);
    
    // Fallback: Use data from socialAccounts array if available
    try {
      const user = await User.findById(userId).select('socialAccounts facebookPageName facebookPageThumb');
      const account = user?.socialAccounts?.find(acc => acc.platform === 'facebook');
      
      if (account || user?.facebookPageName) {
        console.log('[Facebook] Returning cached statistics for user:', userId);
        return {
          followers: account?.metadata?.followers_count || 0,
          likes: account?.metadata?.fan_count || 0,
          name: account?.accountName || user?.facebookPageName || 'Facebook Page',
          thumbnail: account?.thumbnail || user?.facebookPageThumb || null,
          isCached: true
        };
      }
    } catch (fallbackErr) {
      console.error('[Facebook] Fallback stats retrieval failed:', fallbackErr.message);
    }
    
    return null;
  }
}

export async function createFacebookLiveStream(userId, { title, description, accountId = null }) {
  const user = await User.findById(userId).select('socialAccounts');
  if (!user || !user.socialAccounts) throw new Error("User not found or social accounts missing");
  
  let account;
  if (accountId) {
    account = user.socialAccounts.find(acc => acc.platform === 'facebook' && acc.accountId === accountId);
  } else {
    account = user.socialAccounts.find(acc => acc.platform === 'facebook');
  }

  if (!account?.accessToken || !account?.accountId) {
    throw new Error("Facebook not connected or Page not selected");
  }

  const accessToken = account.accessToken;
  const pageId = account.accountId;

  try {
    const response = await axios.post(`https://graph.facebook.com/v25.0/${pageId}/live_videos`, null, {
      params: {
        title,
        description,
        status: 'LIVE_NOW',
        access_token: accessToken
      }
    });

    const data = response.data;
    const streamUrl = data.secure_stream_url;
    const lastSlashIndex = streamUrl.lastIndexOf('/');
    const rtmpBase = streamUrl.substring(0, lastSlashIndex + 1);
    const streamKey = streamUrl.substring(lastSlashIndex + 1);

    return {
      success: true,
      id: data.id,
      rtmpUrl: rtmpBase,
      streamKey: streamKey,
      watchUrl: `https://facebook.com/${data.id}`
    };
  } catch (err) {
    console.error('[Facebook] Stream Create Error:', err.response?.data || err.message);
    throw new Error(err.response?.data?.error?.message || "Failed to create Facebook Live Stream");
  }
}

export async function endFacebookLiveStream(userId, liveVideoId, accountId = null) {
  const user = await User.findById(userId).select('socialAccounts');
  if (!user || !user.socialAccounts) throw new Error("User not found or social accounts missing");
  
  let account;
  if (accountId) {
    account = user.socialAccounts.find(acc => acc.platform === 'facebook' && acc.accountId === accountId);
  } else {
    account = user.socialAccounts.find(acc => acc.platform === 'facebook');
  }

  if (!account?.accessToken) throw new Error("Facebook not connected");

  try {
    await axios.post(`https://graph.facebook.com/v25.0/${liveVideoId}`, null, {
      params: {
        end_live_video: true,
        access_token: account.accessToken
      }
    });
    return { success: true };
  } catch (err) {
    console.error('[Facebook] Stream End Error:', err.response?.data || err.message);
    return { success: false, error: err.message };
  }
}
