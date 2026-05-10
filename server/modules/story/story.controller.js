import Story from '../../models/story.model.js';
import User from '../../models/user.model.js';
import Owner from '../../models/owner.model.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';

export const createStory = async (req, res) => {
  try {
    const { mediaType, durationDays, content } = req.body;
    const userId = req.user.id;

    const userModel = req.user?.role === 'user' ? 'User' : 'Owner';
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(durationDays || 1));

    let createdStories = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const mediaUrl = await uploadToCloudinary(file.buffer, 'kridaz/stories');
        const newStory = new Story({
          userId,
          userModel,
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
      const mediaUrl = await uploadToCloudinary(req.file.buffer, 'kridaz/stories');
      const newStory = new Story({
        userId,
        userModel,
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
        userModel,
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
    const { all } = req.query;
    const userId = req.user.id;
    
    let userIds = [];
    
    if (all === 'true') {
      // For global community feed, we don't filter by userIds initially
    } else {
      let user = await User.findById(userId);
      let following = [];
      
      if (user) {
        following = user.following || [];
      } else {
        user = await Owner.findById(userId);
        if (user) {
          following = user.following || [];
        }
      }
      
      userIds = [...following.map(id => id.toString()), userId];
    }

    const query = { expiresAt: { $gt: new Date() } };
    if (all !== 'true') {
      query.userId = { $in: userIds };
    }

    let stories = await Story.find(query)
      .populate('userId', 'name username profilePicture')
      .sort({ createdAt: -1 });

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
      updateData.mediaUrl = await uploadToCloudinary(req.file.buffer, 'kridaz/stories');
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
    let stories = await Story.find()
      .populate('userId', 'name username email profilePicture')
      .sort({ createdAt: -1 });

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
