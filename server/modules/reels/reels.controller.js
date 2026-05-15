import Reel from '../../models/reel.model.js';
import ReelInteraction from '../../models/reelInteraction.model.js';
import ReelComment from '../../models/reelComment.model.js';

import { mediaQueue } from '../../queues/media.queue.js';
import mongoose from 'mongoose';
import crypto from 'crypto';
import path from 'path';
import { getIO } from '../../config/socket.js';
import { getPresignedUploadUrl } from '../../utils/r2.js';

const COOKIE_SETTINGS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  domain: process.env.NODE_ENV === 'production' ? '.kridaz.com' : 'localhost',
  maxAge: 7200 * 1000
};

/**
 * Get Presigned URL for direct R2 upload
 */
export const getUploadUrl = async (req, res) => {
  try {
    const { contentType, fileName } = req.query;
    if (!contentType) return res.status(400).json({ success: false, message: 'contentType is required' });

    const reelId = new mongoose.Types.ObjectId();
    const extension = fileName ? path.extname(fileName) : '.mp4';
    const key = `temp/reels/${reelId}${extension}`;
    
    const uploadUrl = await getPresignedUploadUrl(key, contentType);

    res.json({
      success: true,
      reelId,
      uploadUrl,
      key,
      cdnUrl: process.env.REELS_CDN_URL
    });
  } catch (error) {
    console.error('[REELS] Get Upload URL Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Confirm upload and start transcoding
 */
export const confirmUpload = async (req, res) => {
  try {
    const { reelId, key, caption, hashtags } = req.body;
    const userId = req.user.id;

    if (!reelId || !key) {
      return res.status(400).json({ success: false, message: 'reelId and key are required' });
    }

    // 1. Create Reel record
    const reel = new Reel({
      _id: reelId,
      creatorId: userId,
      caption,
      hashtags: hashtags ? (Array.isArray(hashtags) ? hashtags : hashtags.split(',').map(h => h.trim())) : [],
      status: 'pending',
      rawVideoUrl: `${process.env.REELS_CDN_URL}/${key}`
    });

    await reel.save();

    // 2. Push to transcoding queue
    await mediaQueue.add('TRANSCODE_VIDEO', { 
      mediaId: reel._id,
      mediaType: 'reel'
    });

    res.status(201).json({ 
      success: true, 
      message: 'Upload confirmed. Processing started.',
      reel 
    });
  } catch (error) {
    console.error('[REELS] Confirm Upload Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Upload a new Reel (Legacy)
 */
export const uploadReel = async (req, res) => {
  try {
    const { caption, hashtags } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    // 1. We no longer upload to Cloudinary here to avoid timeouts.
    // Instead, we pass the local path to the worker.
    const localPath = path.resolve(req.file.path);

    // 2. Create Reel record in DB with 'pending' status
    const reel = new Reel({
      creatorId: userId,
      caption,
      hashtags: hashtags ? (Array.isArray(hashtags) ? hashtags : hashtags.split(',').map(h => h.trim())) : [],
      status: 'pending'
    });

    await reel.save();

    // 3. Push to transcoding queue with local file path
    await reelQueue.add('TRANSCODE_REEL', { 
      reelId: reel._id,
      localPath 
    });

    res.status(201).json({ 
      success: true, 
      message: 'Reel upload successful. Optimization is starting in the background.',
      reel 
    });
  } catch (error) {
    console.error('[REELS] Upload Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Personalized Reel Feed
 */
export const getReelsFeed = async (req, res) => {
  try {
    const { cursor, limit = 10, initialId } = req.query;
    let initialReel = null;
    
    if (initialId && !cursor) {
      initialReel = await Reel.findOne({ _id: initialId, status: 'ready' })
        .populate('creatorId', 'name username profilePicture');
    }

    const query = { status: 'ready', isPrivate: false };
    if (cursor) {
      query._id = { $lt: cursor };
    } else if (initialId) {
      query._id = { $ne: initialId };
    }

    const reels = await Reel.find(query)
      .populate('creatorId', 'name username profilePicture')
      .select('caption hashtags stats hlsUrl rawVideoUrl thumbnailUrl creatorId createdAt')
      .sort({ _id: -1 }) 
      .limit(parseInt(limit))
      .lean(); // Use lean for faster JSON serialization

    const finalReels = initialReel ? [initialReel, ...reels] : reels;
    const nextCursor = reels.length > 0 ? reels[reels.length - 1]._id : null;

    // Generate a signed cookie for Cloudflare Edge Auth
    const expiry = Math.floor(Date.now() / 1000) + 7200; 
    const message = `exp=${expiry}`;
    const signature = crypto
      .createHmac('sha256', process.env.REELS_COOKIE_SECRET)
      .update(message)
      .digest('hex');
    
    res.cookie('cf_reel_token', `${message}&sig=${signature}`, COOKIE_SETTINGS);

    // Performance Headers
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(200).json({ 
      success: true, 
      reels: finalReels,
      nextCursor 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Interact with a Reel (Like, View, etc.)
 */
export const interactWithReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const { type, watchTime, completionRate } = req.body;
    const userId = req.user.id;

    // Use findOneAndUpdate to handle unique index for 'like'
    const interaction = await ReelInteraction.findOneAndUpdate(
      { userId, reelId, type: 'like' }, // Only 'like' is unique per user/reel
      { 
        userId, 
        reelId, 
        type, 
        watchTime, 
        completionRate 
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Atomic update of Reel stats
    const updateQuery = {};
    if (type === 'view') updateQuery['stats.views'] = 1;
    if (type === 'like') updateQuery['stats.likes'] = 1;
    if (type === 'share') updateQuery['stats.shares'] = 1;
    if (type === 'complete') updateQuery['stats.completionCount'] = 1;

    if (Object.keys(updateQuery).length > 0) {
      const updatedReel = await Reel.findByIdAndUpdate(reelId, { $inc: updateQuery }, { new: true });
      
      // Socket Broadcast for instant updates
      const io = getIO();
      if (io) {
        if (type === 'like') {
          io.emit('reel_liked', { reelId, likes: updatedReel.stats.likes });
        }
      }
    }

    res.status(200).json({ success: true, interaction });
  } catch (error) {
    // Handle duplicate like error gracefully
    if (error.code === 11000) {
      return res.status(200).json({ success: true, message: 'Already liked' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Add Comment to Reel
 */
export const addComment = async (req, res) => {
  try {
    const { reelId } = req.params;
    const { text, parentId } = req.body;
    const userId = req.user.id;

    const comment = new ReelComment({
      userId,
      reelId,
      text,
      parentId
    });

    await comment.save();
    
    await Reel.findByIdAndUpdate(reelId, { $inc: { 'stats.comments': 1 } });

    // Socket Broadcast
    const io = getIO();
    if (io) {
      io.emit('reel_commented', { reelId, comment });
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Creator Analytics
 */
export const getCreatorAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const reels = await Reel.find({ creatorId: userId });
    
    const totalStats = reels.reduce((acc, reel) => {
      acc.views += reel.stats.views || 0;
      acc.likes += reel.stats.likes || 0;
      acc.comments += reel.stats.comments || 0;
      acc.shares += reel.stats.shares || 0;
      return acc;
    }, { views: 0, likes: 0, comments: 0, shares: 0 });

    res.status(200).json({ 
      success: true, 
      totalStats,
      reelsCount: reels.length,
      reels: reels.map(r => ({
        id: r._id,
        caption: r.caption,
        stats: r.stats,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const trackWatchTime = async (req, res) => {
  const { reelId } = req.params;
  const { watchTime, completed } = req.body;
  const userId = req.user?.id;
  try {
    const updateData = { $inc: { 'stats.avgWatchTime': watchTime } };
    if (completed) updateData.$inc['stats.completionCount'] = 1;
    await Reel.findByIdAndUpdate(reelId, updateData);
    if (userId) {
      await ReelInteraction.findOneAndUpdate(
        { userId, reelId, type: 'view' },
        { $set: { watchTime }, $inc: { totalWatches: 1 } },
        { upsert: true }
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecommendedReels = async (req, res) => {
  const { cursor } = req.query;
  const limit = 5;
  try {
    const query = { status: 'ready', isPrivate: false };
    if (cursor) query._id = { $lt: cursor };
    const reels = await Reel.aggregate([
      { $match: query },
      { $addFields: {
          score: { $add: [
              { $multiply: ['$stats.likes', 2] },
              { $multiply: ['$stats.views', 1] },
              { $multiply: [{ $cond: [{ $gt: ['$stats.views', 0] }, { $divide: ['$stats.completionCount', '$stats.views'] }, 0] }, 500] }
          ]}
      }},
      { $sort: { score: -1, _id: -1 } },
      { $limit: parseInt(limit) }
    ]);
    const reelsWithCreator = await Reel.populate(reels, { path: 'creatorId', select: 'name username profilePicture' });
    const nextCursor = reelsWithCreator.length === limit ? reelsWithCreator[reelsWithCreator.length - 1]._id : null;
    
    // Cloudflare Edge Auth Cookie
    const expiry = Math.floor(Date.now() / 1000) + 7200;
    const message = `exp=${expiry}`;
    const signature = crypto.createHmac('sha256', process.env.REELS_COOKIE_SECRET).update(message).digest('hex');
    res.cookie('cf_reel_token', `${message}&sig=${signature}`, COOKIE_SETTINGS);

    res.json({ success: true, reels: reelsWithCreator, nextCursor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
/**
 * Delete a Reel
 */
export const deleteReel = async (req, res) => {
  try {
    const { reelId } = req.params;
    const userId = req.user.id;

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return res.status(404).json({ success: false, message: 'Reel not found' });
    }

    // Check ownership
    if (reel.creatorId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this reel' });
    }

    // 1. Delete from R2
    const { deleteFromR2, deleteDirectoryFromR2 } = await import('../../utils/r2.js');
    
    // Cleanup HLS and Raw Video (both under reels/{reelId})
    const reelPrefix = `reels/${reelId}`;
    await deleteDirectoryFromR2(reelPrefix).catch(e => console.warn('[REELS] R2 Prefix Cleanup failed:', e));

    // Cleanup Thumbnail
    if (reel.thumbnailUrl && (reel.thumbnailUrl.includes(process.env.REELS_CDN_URL) || reel.thumbnailUrl.includes('r2.dev'))) {
      const thumbKey = `thumbnails/${reelId}.jpg`;
      await deleteFromR2(thumbKey).catch(e => console.warn('[REELS] Thumbnail Cleanup failed:', e));
    }

    // 2. Delete from DB
    await Reel.findByIdAndDelete(reelId);
    await ReelInteraction.deleteMany({ reelId });
    await ReelComment.deleteMany({ reelId });

    // Socket Broadcast
    const io = getIO();
    if (io) {
      io.emit('reel_deleted', { reelId });
    }

    res.status(200).json({ success: true, message: 'Reel deleted successfully' });
  } catch (error) {
    console.error('[REELS] Delete Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
