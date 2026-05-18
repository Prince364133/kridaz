import { prisma } from '../../config/prisma.js';
import { getPresignedUploadUrl } from '../../utils/r2.js';
import { generatePlaceholder } from '../../utils/imageWorker.js';
import { mediaQueue } from '../../queues/media.queue.js';
import SocialService from '../../services/social.service.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from "../../utils/logger.js";

const resolveUserId = async (id) => {
  if (!id) return null;
  const idStr = id.toString();
  try {
    const owner = await prisma.ownerProfile.findUnique({
      where: { id: idStr },
      select: { userId: true }
    });
    if (owner && owner.userId) return owner.userId;
    return idStr;
  } catch (error) {
    return idStr;
  }
};

/**
 * Get Signed URL for Stories
 */
export const getUploadUrl = async (req, res) => {
  try {
    const { contentType, fileName } = req.query;
    const storyId = uuidv4();
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

    // 2. Save Story using Prisma
    const story = await prisma.story.create({
      data: {
        id: storyId,
        userId,
        mediaType,
        mediaUrl: mediaType === 'image' ? mediaUrl : null, // Images serve direct, Videos serve HLS
        rawMediaUrl: mediaUrl,
        placeholder,
        content,
        expiresAt,
        status: mediaType === 'video' ? 'pending' : 'ready',
        durationDays: parseInt(durationDays || 1)
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, profilePicture: true }
        }
      }
    });

    // Formatting for frontend parity (renaming user to userId)
    const populatedStory = { ...story, userId: story.user };
    delete populatedStory.user;

    // 3. If video, trigger ABR transcoding pipeline
    if (mediaType === 'video') {
      await mediaQueue.add('TRANSCODE_VIDEO', { 
        mediaId: story.id,
        mediaType: 'story'
      });
    }

    res.status(201).json({ success: true, story: populatedStory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



export const createStory = async (req, res) => {
  try {
    const { mediaType, durationDays, content } = req.body;
    const rawId = req.user.id;
    const userId = await resolveUserId(rawId);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays || 1));

    let createdStories = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const mediaUrl = await uploadToCloudinary(file.buffer, 'kridaz/stories');
        const newStory = await prisma.story.create({
          data: {
            userId,
            mediaUrl,
            mediaType: mediaType || 'image',
            content,
            durationDays: parseInt(durationDays || 1),
            expiresAt
          }
        });
        createdStories.push(newStory);
      }
    } else if (req.file) {
      const mediaUrl = await uploadToCloudinary(req.file.buffer, 'kridaz/stories');
      const newStory = await prisma.story.create({
        data: {
          userId,
          mediaUrl,
          mediaType: mediaType || 'image',
          content,
          durationDays: parseInt(durationDays || 1),
          expiresAt
        }
      });
      createdStories.push(newStory);
    } else {
      const newStory = await prisma.story.create({
        data: {
          userId,
          mediaUrl: '',
          mediaType: 'text',
          content,
          durationDays: parseInt(durationDays || 1),
          expiresAt
        }
      });
      createdStories.push(newStory);
    }

    res.status(201).json({ success: true, stories: createdStories, story: createdStories[0] });
  } catch (error) {
    logger.error('Error creating story:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStories = async (req, res) => {
  try {
    const { all } = req.query;
    const rawId = req.user?.id || req.admin?.id;
    const userId = rawId ? await resolveUserId(rawId) : null;
    
    let userIds = userId ? [userId] : []; 
    
    if (all !== 'true' && userId) {
      const networkIds = await SocialService.getNetworkIds(userId);
      userIds = [...new Set([...userIds, ...networkIds])];
    } else if (all !== 'true' && !userId) {
      // If unauthenticated and asking for network feed, return empty or treat as all=true?
      // Let's treat as global public feed for unauthenticated users viewing the community.
      // We will just not filter by userIds later.
    }

    const baseWhere = { expiresAt: { gt: new Date() } };
    if (all !== 'true' && userId) {
      baseWhere.userId = { in: userIds };
    }

    const where = {
      ...baseWhere,
      ...(userId ? {
        OR: [
          { status: 'ready' },
          { userId: userId, status: { in: ['pending', 'processing'] } }
        ]
      } : { status: 'ready' })
    };

    // Fetch stories with user and viewer relations using Prisma
    let stories = await prisma.story.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, username: true, profilePicture: true } },
        viewers: { select: { id: true, name: true, username: true, profilePicture: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // safety cap per feed load
    });

    // Group stories by user and map to legacy format
    const groupedStories = stories.reduce((acc, story) => {
      const storyUser = story.user;
      if (!storyUser) return acc;

      const storyUserId = storyUser.id;
      
      // Map back to legacy fields for frontend compatibility
      const legacyStory = {
        ...story,
        userId: storyUser,
        viewers: story.viewers
      };

      if (!acc[storyUserId]) {
        acc[storyUserId] = {
          author: storyUser,
          user: storyUser,
          stories: []
        };
      }
      acc[storyUserId].stories.push(legacyStory);
      return acc;
    }, {});

    // Ensure current user's group is first in the list if it exists
    const finalStories = Object.values(groupedStories).sort((a, b) => {
      const aId = a.author.id;
      const bId = b.author.id;
      if (aId === userId) return -1;
      if (bId === userId) return 1;
      return 0;
    });

    res.status(200).json({ success: true, stories: finalStories });
  } catch (error) {
    logger.error("Get Stories Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const story = await prisma.story.findUnique({ where: { id } });
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    // Only owner or admin can delete
    if (story.userId !== userId && userRole?.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.story.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Story deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, durationDays } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const story = await prisma.story.findUnique({ where: { id } });
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    // Only owner or admin can edit
    if (story.userId !== userId && userRole?.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    let updateData = { content };
    if (durationDays) {
      updateData.durationDays = parseInt(durationDays);
      const expiresAt = new Date(story.createdAt);
      expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays));
      updateData.expiresAt = expiresAt;
    }

    if (req.file) {
      updateData.mediaUrl = await uploadToCloudinary(req.file.buffer, 'kridaz/stories');
    }

    const updatedStory = await prisma.story.update({
      where: { id },
      data: updateData
    });
    res.status(200).json({ success: true, story: updatedStory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const viewStory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.story.update({
      where: { id },
      data: {
        viewers: {
          connect: { id: userId }
        }
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllStoriesAdmin = async (req, res) => {
  try {
    let stories = await prisma.story.findMany({
      include: {
        user: { select: { id: true, name: true, username: true, email: true, profilePicture: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // admin safety cap
    });

    const formattedStories = stories.map(story => {
      const storyObj = { ...story, userId: story.user };
      delete storyObj.user;
      storyObj.userId = storyObj.userId || { id: story.userId, name: 'Unknown', username: 'Unknown' };
      return storyObj;
    });

    res.status(200).json({ success: true, stories: formattedStories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
