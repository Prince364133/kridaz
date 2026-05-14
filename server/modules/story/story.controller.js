import Story from '../../models/story.model.js';
import User from '../../models/user.model.js';
import Owner from '../../models/owner.model.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';

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

export const createStory = async (req, res) => {
  try {
    const { mediaType, durationDays, content } = req.body;
    const rawId = req.user.id;
    const userId = await resolveUserId(rawId);

    const userModel = 'User';
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
      // because stories are now saved with User IDs.
      const resolvedNetworkIds = await Promise.all(networkIds.map(id => resolveUserId(id)));
      
      userIds = [...new Set([...userIds, ...resolvedNetworkIds])];
    }

    const query = { expiresAt: { $gt: new Date() } };
    if (all !== 'true') {
      query.userId = { $in: userIds };
    }

    // Select userModel to ensure refPath population works correctly
    let stories = await Story.find(query)
      .populate('userId', 'name username profilePicture')
      .populate('viewers', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .limit(50); // safety cap per feed load

    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
      // Robust grouping: even if userId didn't populate, we use the ID string
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

    // Ensure current user's group is first in the list if it exists
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
      .sort({ createdAt: -1 })
      .limit(100); // admin safety cap

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
