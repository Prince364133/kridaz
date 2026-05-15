import mongoose from "mongoose";
import User from "../../models/user.model.js";
import Owner from "../../models/owner.model.js";
import Story from "../../models/story.model.js";

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

export const getPublicPlayers = async (req, res) => {
  const { lat, lng, city, state, sport } = req.query;
  try {
    let pipeline = [];

    // 1. Proximity Search
    if (lat && lng) {
      const radius = req.query.radius ? parseFloat(req.query.radius) : 5000; // Default 5km
      const geoNearStage = {
        $geoNear: {
          near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: "distance",
          spherical: true,
          maxDistance: radius,
          query: {}
        }
      };

      if (city) geoNearStage.$geoNear.query.city = { $regex: new RegExp(`^${city}$`, "i") };
      if (state) geoNearStage.$geoNear.query.state = { $regex: new RegExp(`^${state}$`, "i") };
      if (sport) geoNearStage.$geoNear.query.sportTypes = { $regex: new RegExp(`^${sport}$`, "i") };

      pipeline.push(geoNearStage);
      if (req.query.sortBy === 'newest') {
        pipeline.push({ $sort: { createdAt: -1 } });
      }
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
      profilePicture: u.profilePicture || u.profileImage,
      location: u.location || u.city || "Nearby",
      city: u.city,
      state: u.state,
      sportTypes: u.sportTypes || [],
      locationData: u.locationData,
      distance: u.distance ? (u.distance / 1000).toFixed(1) : null, // in km
      hasActiveStory: activeStories.some(id => id.toString() === u._id.toString()) && (
        req.user ? (
          u.followers?.some(f => f.toString() === req.user.id.toString()) || 
          u.following?.some(f => f.toString() === req.user.id.toString())
        ) : false
      ),
      isFollowing: req.user ? u.followers?.some(f => f.toString() === req.user.id.toString()) : false
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
    }).select('name username profilePicture profileImage location bio followers following');

    const userIds = players.map(u => u._id);
    const activeStories = await Story.distinct('userId', {
      userId: { $in: userIds },
      expiresAt: { $gt: new Date() }
    });

    players = players.map(u => {
      const userObj = u.toObject();
      return {
        ...userObj,
        hasActiveStory: activeStories.some(id => id.toString() === u._id.toString()) && (
          req.user ? (
            userObj.followers?.some(f => f.toString() === req.user.id.toString()) || 
            userObj.following?.some(f => f.toString() === req.user.id.toString())
          ) : false
        )
      };
    });

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

    const currentUserId = await resolveUserId(decoded.id || decoded._id);
    const targetUserId = await resolveUserId(id);

    if (targetUserId === currentUserId) {
      return res.status(400).json({ success: false, message: "You cannot follow yourself" });
    }

    // Always use User model for social network if it exists
    const userExists = await User.exists({ _id: currentUserId });
    const targetUserExists = await User.exists({ _id: targetUserId });

    if (userExists) {
      await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } });
    } else {
      await Owner.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } });
    }

    if (targetUserExists) {
      await User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } });
    } else {
      await Owner.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } });
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

    const currentUserId = await resolveUserId(decoded.id || decoded._id);
    const targetUserId = await resolveUserId(id);

    // Update current user's following list (Atomic)
    const userExists = await User.exists({ _id: currentUserId });
    if (userExists) {
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } });
    } else {
      await Owner.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } });
    }

    // Update target user's followers list (Atomic)
    const targetUserExists = await User.exists({ _id: targetUserId });
    if (targetUserExists) {
      await User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } });
    } else {
      await Owner.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } });
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
    let user = await User.findById(currentUserId).lean();

    if (!user) {
      user = await Owner.findById(currentUserId).lean();
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const fetchUsersAndOwners = async (ids) => {
      const users = await User.find({ _id: { $in: ids } }).select('name username profilePicture location bio').lean();
      const owners = await Owner.find({ _id: { $in: ids } }).select('name businessDetails profilePicture location bio').lean();
      
      const mappedOwners = owners.map(o => ({
        ...o,
        username: o.businessDetails?.businessName || o.name
      }));
      return [...users, ...mappedOwners];
    };

    const followers = await fetchUsersAndOwners(user.followers || []);
    const following = await fetchUsersAndOwners(user.following || []);

    return res.status(200).json({ 
      success: true, 
      followers,
      following 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPlayerProfile = async (req, res) => {
  try {
    const targetUserId = await resolveUserId(req.params.id);
    let user = await User.findById(targetUserId).select('-password');
    let ownerDoc = null;

    if (!user) {
      ownerDoc = await Owner.findById(targetUserId).select('-password');
      if (ownerDoc && ownerDoc.userId) {
        user = await User.findById(ownerDoc.userId).select('-password');
      } else if (ownerDoc) {
        // Legacy or owner without linked user
        user = ownerDoc;
      }
    } else {
      // User found, check if they have owner details
      ownerDoc = await Owner.findOne({ userId: user._id });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const bookingCount = user.bookings ? user.bookings.length : 0;
    
    // Check for active stories
    let hasActiveStory = false;
    const activeStory = await Story.findOne({
      userId: user._id,
      expiresAt: { $gt: new Date() }
    });

    if (activeStory) {
      const viewerId = req.user?.id;
      if (viewerId) {
        if (viewerId.toString() === user._id.toString()) {
          hasActiveStory = true;
        } else {
          const isFollowing = user.followers?.some(id => id.toString() === viewerId.toString());
          const isFollowedBy = user.following?.some(id => id.toString() === viewerId.toString());
          if (isFollowing || isFollowedBy) {
            hasActiveStory = true;
          }
        }
      }
    }

    return res.status(200).json({ 
      success: true, 
      profile: {
        _id: user._id,
        name: user.name,
        username: user.username || ownerDoc?.businessDetails?.businessName || ownerDoc?.username || "Member",
        profilePicture: user.profilePicture || ownerDoc?.profilePicture,
        location: user.location || ownerDoc?.location,
        city: user.city || ownerDoc?.businessDetails?.city || ownerDoc?.city,
        state: user.state || ownerDoc?.businessDetails?.state || ownerDoc?.state,
        sportTypes: user.sportTypes || ownerDoc?.sportTypes || ownerDoc?.gameTypes || [],
        bio: user.bio || ownerDoc?.businessDetails?.experience || ownerDoc?.bio,
        followers: user.followers || [],
        following: user.following || [],
        interests: user.interests || [],
        bookingCount,
        hasActiveStory: hasActiveStory,
        role: ownerDoc?.role || user.role || "user",
        stats: user.stats || {
          cricket: {
            matches: 0,
            runs: 0,
            wickets: 0,
            highestScore: 0,
            battingAverage: 0,
            battingStrikeRate: 0,
            bowlingAverage: 0,
            bowlingEconomy: 0
          }
        },
        badges: user.stats?.badges || [],
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
    let user = await User.findById(id).lean();

    // If not found, try Owner
    if (!user) {
      user = await Owner.findById(id).lean();
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
    }

    const fetchUsersAndOwners = async (ids) => {
      const users = await User.find({ _id: { $in: ids } }).select('name username profilePicture location bio').lean();
      const owners = await Owner.find({ _id: { $in: ids } }).select('name businessDetails profilePicture location bio').lean();
      
      const mappedOwners = owners.map(o => ({
        ...o,
        username: o.businessDetails?.businessName || o.name
      }));
      return [...users, ...mappedOwners];
    };

    let followers = await fetchUsersAndOwners(user.followers || []);
    let following = await fetchUsersAndOwners(user.following || []);

    if (currentUserId) {
      const currentUser = await User.findById(currentUserId).lean();
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
      followers,
      following 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const { category = 'batting', limit = 20 } = req.query;

    let sortQuery = {};
    if (category === 'batting') {
      sortQuery = { 'stats.cricket.runs': -1 };
    } else if (category === 'bowling') {
      sortQuery = { 'stats.cricket.wickets': -1 };
    } else {
      sortQuery = { 'stats.cricket.runs': -1 }; // Default to batting
    }

    const players = await User.find({
      $or: [
        { 'stats.cricket.runs': { $gt: 0 } },
        { 'stats.cricket.wickets': { $gt: 0 } }
      ]
    })
    .sort(sortQuery)
    .limit(parseInt(limit))
    .select('name username profilePicture stats city');

    const rankedPlayers = players.map((p, index) => ({
      ...p.toObject(),
      rank: index + 1
    }));

    return res.status(200).json({ success: true, players: rankedPlayers });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get nearby players for the Live Map
 * Optimized for map data payload
 */
export const getNearbyPlayers = async (req, res) => {
  const { lat, lng, radius = 5000, limit = 50 } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ success: false, message: "Location coordinates required" });
  }

  try {
    const players = await User.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: "distance",
          spherical: true,
          maxDistance: parseFloat(radius),
          query: { 
            locationData: { $exists: true },
            _id: { $ne: new mongoose.Types.ObjectId(req.user?.id) }
          }
        }
      },
      { $limit: parseInt(limit) },
      {
        $project: {
          name: 1,
          username: 1,
          profilePicture: { $ifNull: ["$profilePicture", "$profileImage"] },
          lat: { $arrayElemAt: ["$locationData.coordinates", 1] },
          lng: { $arrayElemAt: ["$locationData.coordinates", 0] },
          distanceKm: { $divide: ["$distance", 1000] },
          sportTypes: 1,
          lastSeen: 1
        }
      }
    ]);

    return res.status(200).json({ success: true, players });
  } catch (err) {
    console.error("Nearby players error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update user location and privacy sharing flag
 */
export const updateUserLocation = async (req, res) => {
  const { lat, lng, sharing = true } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    let update = {};
    
    if (sharing === false || (lat === 0 && lng === 0)) {
      // Clear location for privacy
      update = { $unset: { locationData: "" } };
    } else if (lat && lng) {
      update = {
        locationData: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        lastSeen: new Date()
      };
    } else {
      return res.status(400).json({ success: false, message: "Invalid location data" });
    }

    await User.findByIdAndUpdate(userId, update);
    
    return res.status(200).json({ 
      success: true, 
      message: sharing ? "Location updated" : "Location cleared (Privacy mode)" 
    });
  } catch (err) {
    console.error("Update location error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
