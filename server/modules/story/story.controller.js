import Story from '../../models/story.model.js';
import User from '../../models/user.model.js';
import Owner from '../../models/owner.model.js';
import { getPresignedUploadUrl } from '../../utils/r2.js';
import { generatePlaceholder } from '../../utils/imageWorker.js';
import { mediaQueue } from '../../queues/media.queue.js';
import mongoose from 'mongoose';
import path from 'path';

/**
 * Get Signed URL for Stories
 * This is the modern R2-only way to start a story upload.
 */
export const getUploadUrl = async (req, res) => {
  try {
    const { contentType, fileName } = req.query;
    const storyId = new mongoose.Types.ObjectId();
    const extension = fileName ? path.extname(fileName) : (contentType.includes('video') ? '.mp4' : '.webp');
    const key = `temp/stories/${storyId}${extension}`;
    
    const uploadUrl = await getPresignedUploadUrl(key, contentType);

    res.json({ success: true, storyId, uploadUrl, key });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Confirm Story Upload
 * This is called after the file is successfully uploaded to R2.
 */
export const confirmStory = async (req, res) => {
  try {
    const { storyId, key, mediaType, content, durationDays } = req.body;
    const userId = await resolveUserId(req.user.id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays || 1));

    let placeholder = null;
    const mediaUrl = `${process.env.REELS_CDN_URL}/${key}`;

    // 1. If image, generate instant placeholder
    if (mediaType === 'image') {
      placeholder = await generatePlaceholder(mediaUrl);
    }

    // 2. Save Story
    const story = new Story({
      _id: storyId,
      userId,
      userModel: 'User',
      mediaType,
      mediaUrl: mediaType === 'image' ? mediaUrl : null, // Images serve direct, Videos serve HLS
      rawMediaUrl: mediaUrl,
      placeholder,
      content,
      expiresAt,
      status: mediaType === 'video' ? 'pending' : 'ready'
    });

    await story.save();

    // 3. If video, trigger ABR transcoding pipeline
    if (mediaType === 'video') {
      await mediaQueue.add('TRANSCODE_VIDEO', { 
        mediaId: story._id,
        mediaType: 'story'
      });
    }

    res.status(201).json({ success: true, story });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resolveUserId = async (id) => {
  if (!id) return null;
  try {
    const owner = await Owner.findById(id);
    if (owner && owner.userId) return owner.userId.toString();
    return id.toString();
  } catch (error) {
    return id.toString();
  }
};

/**
 * @deprecated Legacy multipart upload using Cloudinary.
 * All uploads should now use getUploadUrl + confirmStory via R2.
 */
export const createStory = async (req, res) => {
  return res.status(410).json({ 
    success: false, 
    message: "This endpoint is deprecated. Use the R2 pre-signed URL workflow." 
  });
};

export const getStories = async (req, res) => {
  try {
    const { all } = req.query;
    const rawId = req.user.id || req.user._id;
    const userId = await resolveUserId(rawId);
    
    let userIds = [userId]; // Always include resolved current User ID
    
    if (all !== 'true') {
      const user = await User.findById(userId);
      let networkIds = [];
      
      if (user) {
        // Collect following and followers
        networkIds = [...(user.following || []), ...(user.followers || [])].map(id => id.toString());
      }

      // If any of these IDs are Owners, we should ALSO search for their linked User IDs
      const resolvedNetworkIds = await Promise.all(networkIds.map(id => resolveUserId(id)));
      
      userIds = [...new Set([...userIds, ...resolvedNetworkIds])];
    }

    const query = { expiresAt: { $gt: new Date() } };
    if (all !== 'true') {
      query.userId = { $in: userIds };
    }

    let stories = await Story.find(query)
      .populate('userId', 'name username profilePicture')
      .populate('viewers', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .limit(50);

    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
      const storyUser = story.userId;
      if (!storyUser) return acc;

      const storyUserId = (storyUser._id || storyUser).toString();
      
      if (!acc[storyUserId]) {
        acc[storyUserId] = {
          user: typeof storyUser === 'object' ? storyUser : { _id: storyUser, username: 'Unknown Player' },
          stories: []
        };
      }
      acc[storyUserId].stories.push(story);
      return acc;
    }, {});

    const finalStories = Object.values(groupedStories).sort((a, b) => {
      const aId = a.user._id.toString();
      const bId = b.user._id.toString();
      if (aId === userId.toString()) return -1;
      if (bId === userId.toString()) return 1;
      return 0;
    });

    res.status(200).json({ success: true, stories: finalStories });
  } catch (error) {
    console.error("Get Stories Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    if (story.userId.toString() !== userId && userRole !== 'admin' && userRole !== 'BMSP_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await Story.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Story deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @deprecated Legacy update logic. 
 */
export const updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, durationDays } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    if (story.userId.toString() !== userId && userRole !== 'admin' && userRole !== 'BMSP_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    let updateData = { content };
    if (durationDays) {
      updateData.durationDays = parseInt(durationDays);
      const expiresAt = new Date(story.createdAt);
      expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays));
      updateData.expiresAt = expiresAt;
    }

    // Note: We don't support file update for stories in the new pipeline 
    // because it's better to just create a new story.

    const updatedStory = await Story.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ success: true, story: updatedStory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const viewStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await Story.findByIdAndUpdate(id, {
      $addToSet: { viewers: userId }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllStoriesAdmin = async (req, res) => {
  try {
    let stories = await Story.find()
      .populate('userId', 'name username email profilePicture')
      .sort({ createdAt: -1 })
      .limit(100);

    const formattedStories = stories.map(story => {
      const storyObj = story.toObject();
      storyObj.userId = storyObj.userId || { _id: story.userId, name: 'Unknown', username: 'Unknown' };
      return storyObj;
    });

    res.status(200).json({ success: true, stories: formattedStories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
