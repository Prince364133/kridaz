import axios from 'axios';
import User from '../../models/user.model.js';

const FB_APP_ID = process.env.FACEBOOK_APP_ID;
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || `${process.env.APP_BASE_URL}/api/facebook/oauth/callback`;

export const startOAuth = (req, res) => {
  const userId = req.user.id || req.user.user;
  const scope = 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,publish_video';
  // Include userId in state to link account back to user in callback
  const state = userId.toString();
  const url = `https://www.facebook.com/v25.dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=${scope}&response_type=code&state=${state}`;
  
  if (req.headers.accept?.includes('application/json')) {
    return res.json({ url });
  }
  res.redirect(url);
};

export const handleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) throw new Error("No code provided");

    // 1. Exchange code for user access token
    const tokenRes = await axios.get(`https://graph.facebook.com/v25.0/oauth/access_token`, {
      params: {
        client_id: FB_APP_ID,
        client_secret: FB_APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code
      }
    });

    const shortToken = tokenRes.data.access_token;

    // 2. Exchange short-lived token for long-lived token (60-day)
    const longTokenRes = await axios.get(`https://graph.facebook.com/v25.0/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: FB_APP_ID,
        client_secret: FB_APP_SECRET,
        fb_exchange_token: shortToken
      }
    });

    const longToken = longTokenRes.data.access_token;

    // 3. Fetch User's Pages
    const pagesRes = await axios.get(`https://graph.facebook.com/v25.0/me/accounts`, {
      params: {
        access_token: longToken,
        fields: 'id,name,picture,access_token,followers_count,fan_count'
      }
    });

    const pages = pagesRes.data.data || [];
    const user = await User.findById(state);
    if (!user) throw new Error("User not found");

    for (const page of pages) {
      const pageId = page.id;
      const pageName = page.name;
      const pageThumb = page.picture?.data?.url;
      const pageToken = page.access_token;

      // Remove existing to avoid duplicates
      await User.findByIdAndUpdate(state, {
        $pull: { socialAccounts: { platform: 'facebook', accountId: pageId } }
      });

      // Add to socialAccounts
      await User.findByIdAndUpdate(state, {
        $push: {
          socialAccounts: {
            platform: 'facebook',
            accountId: pageId,
            accountName: pageName,
            thumbnail: pageThumb,
            accessToken: pageToken,
            expiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // ~60 days
            metadata: {
              statistics: {
                followers: page.followers_count || 0,
                likes: page.fan_count || 0
              }
            }
          }
        }
      });
    }

    // Update legacy fields with the first page if available
    if (pages.length > 0) {
      await User.findByIdAndUpdate(state, {
        facebookAccessToken: pages[0].access_token,
        facebookPageId: pages[0].id,
        facebookPageName: pages[0].name,
        facebookPageThumb: pages[0].picture?.data?.url
      });
    }

    // Redirect to frontend setup with the long-lived token and state (userId)
    const frontendUrl = process.env.VITE_APP_URL || 'http://localhost:5174';
    res.redirect(`${frontendUrl}/facebook-connected`);

  } catch (error) {
    console.error("Facebook OAuth Error:", error.response?.data || error.message);
    const frontendUrl = process.env.VITE_APP_URL || 'http://localhost:5174';
    res.redirect(`${frontendUrl}/facebook-error`);
  }
};

export const savePage = async (req, res) => {
  try {
    const { pageId, accessToken, name, picture } = req.body;
    const userId = req.user.id || req.user.user;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update primary fields (for backward compatibility)
    user.facebookAccessToken = accessToken;
    user.facebookPageId = pageId;
    user.facebookPageName = name;
    user.facebookPageThumb = picture;

    // Add to socialAccounts array if not already present
    const existingIndex = user.socialAccounts.findIndex(acc => acc.accountId === pageId && acc.platform === 'facebook');
    if (existingIndex > -1) {
      user.socialAccounts[existingIndex] = {
        platform: 'facebook',
        accountId: pageId,
        accountName: name,
        accessToken: accessToken,
        thumbnail: picture,
        expiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // ~60 days
      };
    } else {
      user.socialAccounts.push({
        platform: 'facebook',
        accountId: pageId,
        accountName: name,
        accessToken: accessToken,
        thumbnail: picture,
        expiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      });
    }

    await user.save();
    res.json({ success: true, message: "Facebook page connected!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAccounts = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user;
    const user = await User.findById(userId).select('socialAccounts');
    
    const accounts = user.socialAccounts.filter(acc => acc.platform === 'facebook');
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFacebookAccount = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user;
    const user = await User.findById(userId).select('facebookPageId facebookPageName facebookPageThumb');
    
    if (!user.facebookPageId) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      page: {
        id: user.facebookPageId,
        name: user.facebookPageName,
        thumbnail: user.facebookPageThumb
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const disconnectFacebook = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user;
    await User.findByIdAndUpdate(userId, {
      facebookAccessToken: null,
      facebookPageId: null,
      facebookPageName: null,
      facebookPageThumb: null,
      $pull: { socialAccounts: { platform: 'facebook' } }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.id || req.user.user;

    await User.findByIdAndUpdate(userId, {
      $pull: { socialAccounts: { platform: 'facebook', accountId } }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
