import CommunityPost from '../../models/communityPost.model.js';
import Story from '../../models/story.model.js';
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

export const createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    // Normalized in middleware, handles both userAuth and adminAuth
    const rawId = req.user?.id || req.admin?.id; 
    const creatorId = await resolveUserId(rawId);

    if (!creatorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let image = '';
    if (req.file) {
      image = await uploadToCloudinary(req.file.buffer, 'kridaz/community');
    }

    const newPost = new CommunityPost({
      adminId: creatorId,
      authorModel: 'User',
      title,
      content,
      image
    });

    await newPost.save();

    res.status(201).json({ success: true, post: newPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPosts = async (req, res) => {
  try {
    const posts = await CommunityPost.find()
      .populate('adminId', 'name profilePicture username')
      .populate('likes', 'name profilePicture username')
      .populate('comments.userId', 'name profilePicture username')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get active stories for authors
    const authorIds = posts.map(p => p.adminId?._id).filter(id => id);
    const activeStories = await Story.find({
      userId: { $in: authorIds },
      expiresAt: { $gt: new Date() }
    });

    const activeStoryUserIds = new Set(activeStories.map(s => s.userId.toString()));

    const postsWithStoryStatus = posts.map(post => {
      const postObj = post.toObject();
      if (postObj.adminId) {
        postObj.adminId.hasActiveStory = activeStoryUserIds.has(postObj.adminId._id.toString());
      }
      return postObj;
    });

    res.status(200).json({ success: true, posts: postsWithStoryStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const rawId = req.user?.id || req.admin?.id;
    const userId = await resolveUserId(rawId);
    const role = req.user?.role || req.admin?.role;

    const post = await CommunityPost.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check ownership or admin role
    const isAuthor = post.adminId.toString() === userId;
    const isAdmin = role === 'admin' || role === 'BMSP_ADMIN';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this post' });
    }

    let updateData = { title, content };
    if (req.file) {
      updateData.image = await uploadToCloudinary(req.file.buffer, 'kridaz/community');
    }

    const updatedPost = await CommunityPost.findByIdAndUpdate(id, updateData, { new: true });
    res.status(200).json({ success: true, post: updatedPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const rawId = req.user?.id || req.admin?.id;
    const userId = await resolveUserId(rawId);
    const role = req.user?.role || req.admin?.role;

    const post = await CommunityPost.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check ownership or admin role
    const isAuthor = post.adminId.toString() === userId;
    const isAdmin = role === 'admin' || role === 'BMSP_ADMIN';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this post' });
    }

    await CommunityPost.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const rawId = req.user?.id || req.admin?.id;
    const userId = await resolveUserId(rawId);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const post = await CommunityPost.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    
    const index = post.likes.indexOf(userId);
    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }
    
    await post.save();
    
    // Populate likes before sending back
    const populatedPost = await CommunityPost.findById(id).populate('likes', 'name profilePicture username');
    
    res.status(200).json({ 
      success: true, 
      likesCount: populatedPost.likes.length, 
      isLiked: index === -1,
      likes: populatedPost.likes 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const rawId = req.user?.id || req.admin?.id;
    const userId = await resolveUserId(rawId);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const post = await CommunityPost.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    
    post.comments.push({
      userId,
      userName: req.user?.name || 'Admin',
      userImage: req.user?.profilePicture,
      text
    });
    
    await post.save();
    
    // Populate comments before sending back
    const populatedPost = await CommunityPost.findById(id).populate('comments.userId', 'name profilePicture username');
    
    res.status(200).json({ success: true, comments: populatedPost.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { text } = req.body;
    const rawId = req.user?.id || req.admin?.id;
    const userId = await resolveUserId(rawId);

    const post = await CommunityPost.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this comment' });
    }

    comment.text = text;
    await post.save();

    res.status(200).json({ success: true, comments: post.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const rawId = req.user?.id || req.admin?.id;
    const userId = await resolveUserId(rawId);
    const role = req.user?.role || req.admin?.role;

    const post = await CommunityPost.findById(id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    // Allow user to delete their own comment, OR post admin can delete any comment (optional, but good)
    if (comment.userId.toString() !== userId && post.adminId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this comment' });
    }

    post.comments.pull({ _id: commentId });
    await post.save();

    res.status(200).json({ success: true, comments: post.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyActivity = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Fetch posts the user commented on or liked
    const posts = await CommunityPost.find({
      $or: [
        { 'comments.userId': userId },
        { 'likes': userId }
      ]
    })
      .populate('adminId', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(50); // safety cap

    // Filter and format for profile view
    const activity = posts.map(post => ({
      postId: post._id,
      postTitle: post.title || 'Untitled Update',
      postImage: post.image,
      adminName: post.adminId?.name,
      myComments: post.comments.filter(c => c.userId.toString() === userId),
      isLiked: post.likes.includes(userId),
      createdAt: post.createdAt
    }));

    res.status(200).json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { targetUserId: paramId } = req.params;
    let targetUserId = paramId || req.user?.id;
    if (!targetUserId) return res.status(400).json({ success: false, message: 'User ID required' });

    // Handle Owner-User identity mapping
    const owner = await Owner.findById(targetUserId);
    const searchIds = [targetUserId];
    if (owner && owner.userId) {
      searchIds.push(owner.userId.toString());
    } else {
      const linkedOwner = await Owner.findOne({ userId: targetUserId });
      if (linkedOwner) searchIds.push(linkedOwner._id.toString());
    }

    const posts = await CommunityPost.find({ adminId: { $in: searchIds } })
      .populate('adminId', 'name profilePicture username')
      .populate('likes', 'name profilePicture username')
      .populate('comments.userId', 'name profilePicture username')
      .sort({ createdAt: -1 })
      .limit(50); // safety cap

    res.status(200).json({ success: true, posts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserStories = async (req, res) => {
  try {
    const { targetUserId: paramId } = req.params;
    let targetUserId = paramId || req.user?.id;
    if (!targetUserId) return res.status(400).json({ success: false, message: 'User ID required' });

    // Handle Owner-User identity mapping
    const owner = await Owner.findById(targetUserId);
    const searchIds = [targetUserId];
    if (owner && owner.userId) {
      searchIds.push(owner.userId.toString());
    } else {
      const linkedOwner = await Owner.findOne({ userId: targetUserId });
      if (linkedOwner) searchIds.push(linkedOwner._id.toString());
    }

    const stories = await Story.find({ userId: { $in: searchIds } })
      .populate('viewers', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .limit(50); // safety cap

    // Enforce privacy: only allow viewing if own stories OR in social network
    const isOwnContent = req.user?.id && searchIds.some(id => id === req.user.id.toString());
    
    if (req.user?.id && !isOwnContent) {
      // Check social network by finding the primary User document
      const user = await User.findOne({ _id: { $in: searchIds } });
      if (user) {
        const viewerId = req.user.id;
        const isFollowing = user.followers?.some(id => id.toString() === viewerId);
        const isFollowedBy = user.following?.some(id => id.toString() === viewerId);
        
        if (!isFollowing && !isFollowedBy) {
          // If not in network, only show active stories (privacy rule)
          const activeStories = stories.filter(s => s.expiresAt > new Date());
          return res.status(200).json({ success: true, stories: activeStories });
        }
      }
    }

    res.status(200).json({ success: true, stories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
