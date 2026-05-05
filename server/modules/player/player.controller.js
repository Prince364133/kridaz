import mongoose from "mongoose";
import User from "../../models/user.model.js";
import Owner from "../../models/owner.model.js";
import Story from "../../models/story.model.js";

export const getPublicPlayers = async (req, res) => {
  const { lat, lng, city, state, sport } = req.query;
  try {
    let pipeline = [];

    // 1. Proximity Search
    if (lat && lng) {
      const geoNearStage = {
        $geoNear: {
          near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: "distance",
          spherical: true,
          query: {}
        }
      };

      if (city) geoNearStage.$geoNear.query.city = { $regex: new RegExp(`^${city}$`, "i") };
      if (state) geoNearStage.$geoNear.query.state = { $regex: new RegExp(`^${state}$`, "i") };
      if (sport) geoNearStage.$geoNear.query.sportTypes = { $regex: new RegExp(`^${sport}$`, "i") };

      pipeline.push(geoNearStage);
    } else {
      let matchQuery = {};
      if (city) matchQuery.city = { $regex: new RegExp(`^${city}$`, "i") };
      if (state) matchQuery.state = { $regex: new RegExp(`^${state}$`, "i") };
      if (sport) matchQuery.sportTypes = { $regex: new RegExp(`^${sport}$`, "i") };
      
      // Exclude current user
      if (req.user?.id) {
        matchQuery._id = { $ne: new mongoose.Types.ObjectId(req.user.id) };
      }

      pipeline.push({ $match: matchQuery });
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push({ $limit: 50 }); // Higher limit for discovery

    const users = await User.aggregate(pipeline);

    const userIds = users.map(u => u._id);
    const activeStories = await Story.distinct('userId', {
      userId: { $in: userIds },
      expiresAt: { $gt: new Date() }
    });

    const players = users.map((u) => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      bookingCount: u.bookings?.length ?? 0,
      joinedAt: u.createdAt,
      profilePicture: u.profilePicture,
      location: u.location || u.city || "Nearby",
      city: u.city,
      state: u.state,
      sportTypes: u.sportTypes || [],
      distance: u.distance ? (u.distance / 1000).toFixed(1) : null, // in km
      hasActiveStory: activeStories.some(id => id.toString() === u._id.toString())
    }));

    return res.status(200).json({ success: true, players });
  } catch (err) {
    console.error("Error in getPublicPlayers", err);
    return res.status(500).json({ message: err.message });
  }
};

export const searchPlayers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(200).json({ success: true, players: [] });
    }

    let players = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user.id }
    }).select('name username profilePicture location bio followers following');

    const userIds = players.map(u => u._id);
    const activeStories = await Story.distinct('userId', {
      userId: { $in: userIds },
      expiresAt: { $gt: new Date() }
    });

    players = players.map(u => ({
      ...u.toObject(),
      hasActiveStory: activeStories.some(id => id.toString() === u._id.toString())
    }));

    return res.status(200).json({ success: true, players });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const followPlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const decoded = req.user || req.owner;
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const currentUserId = decoded.id || decoded._id;
    const role = decoded.role || "user";

    if (id === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: "You cannot follow yourself" });
    }

    // Update current user's following list (Atomic)
    if (role === "user") {
      await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: id } });
    } else {
      await Owner.findByIdAndUpdate(currentUserId, { $addToSet: { following: id } });
    }

    // Update target user's followers list (Atomic)
    const targetInUser = await User.exists({ _id: id });
    if (targetInUser) {
      await User.findByIdAndUpdate(id, { $addToSet: { followers: currentUserId } });
    } else {
      await Owner.findByIdAndUpdate(id, { $addToSet: { followers: currentUserId } });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Followed successfully" 
    });
  } catch (error) {
    console.error("Follow error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const unfollowPlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const decoded = req.user || req.owner;
    if (!decoded) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const currentUserId = decoded.id || decoded._id;
    const role = decoded.role || "user";

    // Update current user's following list (Atomic)
    if (role === "user") {
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: id } });
    } else {
      await Owner.findByIdAndUpdate(currentUserId, { $pull: { following: id } });
    }

    // Update target user's followers list (Atomic)
    const targetInUser = await User.exists({ _id: id });
    if (targetInUser) {
      await User.findByIdAndUpdate(id, { $pull: { followers: currentUserId } });
    } else {
      await Owner.findByIdAndUpdate(id, { $pull: { followers: currentUserId } });
    }

    return res.status(200).json({ success: true, message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Unfollow error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getNetwork = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    let user = await User.findById(currentUserId)
      .populate('followers', 'name username profilePicture location bio')
      .populate('following', 'name username profilePicture location bio');

    if (!user) {
      user = await Owner.findById(currentUserId)
        .populate('followers', 'name username profilePicture location bio')
        .populate('following', 'name username profilePicture location bio');
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ 
      success: true, 
      followers: (user.followers || []).filter(f => f),
      following: (user.following || []).filter(f => f) 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPlayerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    let user = await User.findById(id).select('-password');
    let isOwner = false;

    if (!user) {
      user = await Owner.findById(id).select('-password');
      isOwner = !!user;
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const bookingCount = user.bookings ? user.bookings.length : 0;
    
    // Check for active stories
    const activeStory = await Story.findOne({
      userId: user._id,
      expiresAt: { $gt: new Date() }
    });

    return res.status(200).json({ 
      success: true, 
      profile: {
        _id: user._id,
        name: user.name,
        username: user.username || user.businessDetails?.businessName || "Member",
        profilePicture: user.profilePicture,
        location: user.location,
        city: user.city || user.businessDetails?.city,
        state: user.state || user.businessDetails?.state,
        sportTypes: user.sportTypes || [],
        bio: user.bio || user.businessDetails?.experience,
        followers: user.followers || [],
        following: user.following || [],
        bookingCount,
        hasActiveStory: !!activeStory,
        role: user.role || (isOwner ? "owner" : "user"),
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getNetworkById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    // Try User first
    let user = await User.findById(id)
      .populate('followers', 'name username profilePicture location bio')
      .populate('following', 'name username profilePicture location bio');

    // If not found, try Owner (Owners don't have followers/following yet in schema, but we should handle gracefully)
    if (!user) {
      user = await Owner.findById(id);
      if (user) {
        return res.status(200).json({ success: true, followers: [], following: [] });
      }
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let followers = user.followers || [];
    let following = user.following || [];

    if (currentUserId) {
      const currentUser = await User.findById(currentUserId);
      const myFollowing = currentUser ? currentUser.following.map(fid => fid.toString()) : [];

      const sortWithCommon = (list) => {
        return [...list].sort((a, b) => {
          const aCommon = myFollowing.includes(a._id.toString());
          const bCommon = myFollowing.includes(b._id.toString());
          if (aCommon && !bCommon) return -1;
          if (!aCommon && bCommon) return 1;
          return 0;
        });
      };

      followers = sortWithCommon(followers);
      following = sortWithCommon(following);
    }

    return res.status(200).json({ 
      success: true, 
      followers: followers.filter(f => f),
      following: following.filter(f => f) 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
