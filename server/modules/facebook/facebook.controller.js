import axios from 'axios';
import { prisma } from '../../config/prisma.js';
import logger from "../../utils/logger.js";

const FB_APP_ID = process.env.FACEBOOK_APP_ID;
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || `${process.env.APP_BASE_URL}/api/facebook/oauth/callback`;

export const startOAuth = (req, res) => {
  const userId = req.user.id || req.user.user;
  const scope = 'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts,publish_video';
  const state = userId.toString();
  const url = `https://www.facebook.com/v25.dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=${scope}&response_type=code&state=${state}`;

  if (req.headers.accept?.includes('application/json')) {
    return res.json({ url });
  }
  res.redirect(url);
};

export const handleCallback = async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    if (!code) throw new Error('No code provided');

    // 1. Exchange code for user access token
    const tokenRes = await axios.get(`https://graph.facebook.com/v25.0/oauth/access_token`, {
      params: {
        client_id:     FB_APP_ID,
        client_secret: FB_APP_SECRET,
        redirect_uri:  REDIRECT_URI,
        code
      }
    });

    const shortToken = tokenRes.data.access_token;

    // 2. Exchange short-lived token for long-lived token (~60 days)
    const longTokenRes = await axios.get(`https://graph.facebook.com/v25.0/oauth/access_token`, {
      params: {
        grant_type:        'fb_exchange_token',
        client_id:         FB_APP_ID,
        client_secret:     FB_APP_SECRET,
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, socialAccounts: true }
    });
    if (!user) throw new Error('User not found');

    const existingAccounts = Array.isArray(user.socialAccounts) ? user.socialAccounts : [];

    // Build updated socialAccounts: remove stale FB entries then add fresh ones
    let updatedAccounts = existingAccounts.filter(
      acc => !(acc.platform === 'facebook' && pages.some(p => p.id === acc.accountId))
    );

    for (const page of pages) {
      updatedAccounts.push({
        platform:    'facebook',
        accountId:   page.id,
        accountName: page.name,
        thumbnail:   page.picture?.data?.url || null,
        accessToken: page.access_token,
        expiry:      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          statistics: {
            followers: page.followers_count || 0,
            likes:     page.fan_count || 0
          }
        }
      });
    }

    // Update user with fresh socialAccounts and legacy primary fields
    await prisma.user.update({
      where: { id: userId },
      data: {
        socialAccounts:    updatedAccounts,
        facebookAccessToken: pages.length > 0 ? pages[0].access_token : undefined,
        facebookPageId:      pages.length > 0 ? pages[0].id : undefined,
        facebookPageName:    pages.length > 0 ? pages[0].name : undefined,
        facebookPageThumb:   pages.length > 0 ? (pages[0].picture?.data?.url || null) : undefined,
        oauth: {
          upsert: {
            create: {
              facebookAccessToken: pages.length > 0 ? pages[0].access_token : undefined,
              facebookPageId:      pages.length > 0 ? pages[0].id : undefined,
              facebookPageName:    pages.length > 0 ? pages[0].name : undefined,
              facebookPageThumb:   pages.length > 0 ? (pages[0].picture?.data?.url || null) : undefined,
            },
            update: {
              facebookAccessToken: pages.length > 0 ? pages[0].access_token : undefined,
              facebookPageId:      pages.length > 0 ? pages[0].id : undefined,
              facebookPageName:    pages.length > 0 ? pages[0].name : undefined,
              facebookPageThumb:   pages.length > 0 ? (pages[0].picture?.data?.url || null) : undefined,
            }
          }
        }
      }
    });

    const frontendUrl = process.env.USER_URL || (process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(',')[0] : 'https://kridaz.com');
    res.redirect(`${frontendUrl}/facebook-connected`);
  } catch (error) {
    logger.error('Facebook OAuth Error:', error.response?.data || error.message);
    const frontendUrl = process.env.USER_URL || (process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(',')[0] : 'https://kridaz.com');
    res.redirect(`${frontendUrl}/facebook-error`);
  }
};

export const savePage = async (req, res) => {
  try {
    const { pageId, accessToken, name, picture } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { socialAccounts: true }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const existingAccounts = Array.isArray(user.socialAccounts) ? user.socialAccounts : [];

    const newEntry = {
      platform:    'facebook',
      accountId:   pageId,
      accountName: name,
      accessToken: accessToken,
      thumbnail:   picture,
      expiry:      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
    };

    const updatedAccounts = existingAccounts.some(
      acc => acc.accountId === pageId && acc.platform === 'facebook'
    )
      ? existingAccounts.map(acc =>
          acc.accountId === pageId && acc.platform === 'facebook' ? newEntry : acc
        )
      : [...existingAccounts, newEntry];

    await prisma.user.update({
      where: { id: userId },
      data: {
        socialAccounts:      updatedAccounts,
        facebookAccessToken: accessToken,
        facebookPageId:      pageId,
        facebookPageName:    name,
        facebookPageThumb:   picture,
        oauth: {
          upsert: {
            create: {
              facebookAccessToken: accessToken,
              facebookPageId:      pageId,
              facebookPageName:    name,
              facebookPageThumb:   picture,
            },
            update: {
              facebookAccessToken: accessToken,
              facebookPageId:      pageId,
              facebookPageName:    name,
              facebookPageThumb:   picture,
            }
          }
        }
      }
    });

    res.json({ success: true, message: 'Facebook page connected!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAccounts = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { socialAccounts: true }
    });

    const accounts = Array.isArray(user?.socialAccounts) ? user.socialAccounts : [];
    res.json(accounts.filter(acc => acc.platform === 'facebook'));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFacebookAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        facebookPageId: true, 
        facebookPageName: true, 
        facebookPageThumb: true,
        oauth: {
          select: {
            facebookPageId: true,
            facebookPageName: true,
            facebookPageThumb: true
          }
        }
      }
    });

    const oauth = user?.oauth || user;

    if (!user?.facebookPageId) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      page: {
        id:        oauth.facebookPageId,
        name:      oauth.facebookPageName,
        thumbnail: oauth.facebookPageThumb
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const disconnectFacebook = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { socialAccounts: true }
    });

    const existingAccounts = Array.isArray(user?.socialAccounts) ? user.socialAccounts : [];
    const updatedAccounts = existingAccounts.filter(acc => acc.platform !== 'facebook');

    await prisma.user.update({
      where: { id: userId },
      data: {
        socialAccounts:      updatedAccounts,
        facebookAccessToken: null,
        facebookPageId:      null,
        facebookPageName:    null,
        facebookPageThumb:   null,
        oauth: {
          update: {
            facebookAccessToken: null,
            facebookPageId:      null,
            facebookPageName:    null,
            facebookPageThumb:   null,
          }
        }
      }
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { socialAccounts: true }
    });

    const existingAccounts = Array.isArray(user?.socialAccounts) ? user.socialAccounts : [];
    const updatedAccounts = existingAccounts.filter(
      acc => !(acc.platform === 'facebook' && acc.accountId === accountId)
    );

    await prisma.user.update({
      where: { id: userId },
      data: { socialAccounts: updatedAccounts }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
