import Story from '../../models/story.model.js';
import User from '../../models/user.model.js';
import Owner from '../../models/owner.model.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';

export const createStory = async (req, res) => {
  try {
    const { mediaType, durationDays, content } = req.body;
    const userId = req.user.id;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays || 1));

    let createdStories = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const mediaUrl = await uploadToCloudinary(file.buffer, 'turfspot/stories');
        const newStory = new Story({
          userId,
          mediaUrl,
          mediaType: mediaType || 'image',
          content,
          durationDays: parseInt(durationDays || 1),
          expiresAt
        });
        await newStory.save();
        createdStories.push(newStory);
      }
    } else if (req.file) {
      const mediaUrl = await uploadToCloudinary(req.file.buffer, 'turfspot/stories');
      const newStory = new Story({
        userId,
        mediaUrl,
        mediaType: mediaType || 'image',
        content,
        durationDays: parseInt(durationDays || 1),
        expiresAt
      });
      await newStory.save();
      createdStories.push(newStory);
    } else {
      const newStory = new Story({
        userId,
        mediaUrl: '',
        mediaType: 'text',
        content,
        durationDays: parseInt(durationDays || 1),
        expiresAt
      });
      await newStory.save();
      createdStories.push(newStory);
    }

    res.status(201).json({ success: true, stories: createdStories, story: createdStories[0] });
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStories = async (req, res) => {
  try {
    const userId = req.user.id;
    let user = await User.findById(userId);
    let following = [];
    
    if (user) {
      // Get users that current user follows
      following = user.following || [];
    } else {
      user = await Owner.findById(userId);
    }
    
    // Include user's own stories
    const userIds = [...following.map(id => id.toString()), userId];

    let stories = await Story.find({ 
      userId: { $in: userIds },
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    // Manually populate userId since it could be User or Owner
    stories = await Promise.all(stories.map(async (story) => {
      let storyUser = await User.findById(story.userId).select('name username profilePicture');
      if (!storyUser) {
        storyUser = await Owner.findById(story.userId).select('name profilePicture');
      }
      
      const storyObj = story.toObject();
      storyObj.userId = storyUser || { _id: story.userId, name: 'Unknown', username: 'Unknown' };
      return storyObj;
    }));

    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
      if (!story.userId || !story.userId._id) return acc;
      const storyUserId = story.userId._id.toString();
      if (!acc[storyUserId]) {
        acc[storyUserId] = {
          user: story.userId,
          stories: []
        };
      }
      acc[storyUserId].stories.push(story);
      return acc;
    }, {});

    res.status(200).json({ success: true, stories: Object.values(groupedStories) });
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

    // Only owner or admin can delete
    if (story.userId.toString() !== userId && userRole !== 'admin' && userRole !== 'BMSP_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await Story.findByIdAndDelete(id);
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

    const story = await Story.findById(id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }

    // Only owner or admin can edit
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

    if (req.file) {
      updateData.mediaUrl = await uploadToCloudinary(req.file.buffer, 'turfspot/stories');
    }

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
    let stories = await Story.find().sort({ createdAt: -1 });

    stories = await Promise.all(stories.map(async (story) => {
      let storyUser = await User.findById(story.userId).select('name username email profilePicture');
      if (!storyUser) {
        storyUser = await Owner.findById(story.userId).select('name email profilePicture');
      }
      
      const storyObj = story.toObject();
      storyObj.userId = storyUser || { _id: story.userId, name: 'Unknown', username: 'Unknown' };
      return storyObj;
    }));

    res.status(200).json({ success: true, stories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
