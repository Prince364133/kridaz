import { prisma } from "../../config/prisma.js";
import SocialService from "../../services/social.service.js";
import WalletService from "../../services/wallet.service.js";
import { findNearby, updateGeoPoint } from "../../utils/geo.util.js";
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

export const getPublicPlayers = async (req, res) => {
  const { lat, lng, city, state, sport } = req.query;
  try {
    const where = {};
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (state) where.state = { contains: state, mode: 'insensitive' };
    if (sport) where.sportTypes = { has: sport }; // Assuming sportTypes is an enum or string array in Prisma
    
    if (req.user?.id) {
      where.id = { not: req.user.id };
    }

    // PostGIS-native proximity search if coordinates provided
    if (lat && lng) {
      const radius = req.query.radius ? parseFloat(req.query.radius) : 5000;
      const nearbyUsers = await findNearby('User', parseFloat(lat), parseFloat(lng), radius, {
        where,
        take: 50,
        include: {
          _count: {
            select: { bookings: true }
          }
        }
      });
      
      // If we used findNearby, we already have the users
      if (nearbyUsers.length > 0) {
        const userIds = nearbyUsers.map(u => u.id);
        const [networkStats, activeStories] = await Promise.all([
          SocialService.getBatchNetworkStats(userIds),
          prisma.story.findMany({
            where: {
              userId: { in: userIds },
              expiresAt: { gt: new Date() }
            },
            select: { userId: true },
            distinct: ['userId']
          })
        ]);
        const storyUserIds = new Set(activeStories.map(s => s.userId));
        
        const players = nearbyUsers.map((u) => {
          const uIdStr = u.id;
          const stats = networkStats.get(uIdStr) || { followerIds: [], followingIds: [] };
          const isFollowing = req.user ? stats.followerIds.includes(req.user.id.toString()) : false;
          const isFollowedBy = req.user ? stats.followingIds.includes(req.user.id.toString()) : false;
          return {
            id: u.id,
            name: u.name,
            username: u.username,
            bookingCount: u._count?.bookings || 0,
            joinedAt: u.createdAt,
            profilePicture: u.profilePicture,
            location: u.city ? `${u.city}, ${u.state}` : "Nearby",
            city: u.city,
            state: u.state,
            sportTypes: u.sportTypes || [],
            hasActiveStory: storyUserIds.has(uIdStr) && (req.user ? (isFollowing || isFollowedBy) : false),
            isFollowing
          };
        });
        return res.status(200).json({ success: true, players });
      }
    }

    const users = await prisma.user.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    });

    const userIds = users.map(u => u.id);

    // 2. Batch fetch metrics
    const [networkStats, activeStories] = await Promise.all([
      SocialService.getBatchNetworkStats(userIds),
      prisma.story.findMany({
        where: {
          userId: { in: userIds },
          expiresAt: { gt: new Date() }
        },
        select: { userId: true },
        distinct: ['userId']
      })
    ]);

    const storyUserIds = new Set(activeStories.map(s => s.userId));
    
    const players = users.map((u) => {
      const uIdStr = u.id;
      const stats = networkStats.get(uIdStr) || { followerIds: [], followingIds: [] };
      
      const isFollowing = req.user ? stats.followerIds.includes(req.user.id.toString()) : false;
      const isFollowedBy = req.user ? stats.followingIds.includes(req.user.id.toString()) : false;

      return {
        id: u.id,
        name: u.name,
        username: u.username,
        bookingCount: u._count.bookings,
        joinedAt: u.createdAt,
        profilePicture: u.profilePicture,
        location: u.city ? `${u.city}, ${u.state}` : "Nearby",
        city: u.city,
        state: u.state,
        sportTypes: u.sportTypes || [],
        hasActiveStory: storyUserIds.has(uIdStr) && (
          req.user ? (isFollowing || isFollowedBy) : false
        ),
        isFollowing
      };
    });

    return res.status(200).json({ success: true, players });
  } catch (err) {
    logger.error("Error in getPublicPlayers", err);
    return res.status(500).json({ message: err.message });
  }
};

export const searchPlayers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(200).json({ success: true, players: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } }
        ],
        id: { not: req.user?.id }
      },
      select: {
        id: true,
        name: true,
        username: true,
        profilePicture: true,
        city: true,
        state: true
      },
      take: 20
    });

    const userIds = users.map(u => u.id);
    
    const [networkStats, activeStories] = await Promise.all([
      SocialService.getBatchNetworkStats(userIds),
      prisma.story.findMany({
        where: {
          userId: { in: userIds },
          expiresAt: { gt: new Date() }
        },
        select: { userId: true },
        distinct: ['userId']
      })
    ]);

    const storyUserIds = new Set(activeStories.map(s => s.userId));

    const players = users.map((u) => {
      const uIdStr = u.id;
      const stats = networkStats.get(uIdStr) || { followerIds: [], followingIds: [] };
      
      const isFollowing = req.user ? stats.followerIds.includes(req.user.id.toString()) : false;
      const isFollowedBy = req.user ? stats.followingIds.includes(req.user.id.toString()) : false;

      return {
        id: u.id,
        _id: u.id,
        name: u.name,
        username: u.username,
        profilePicture: u.profilePicture,
        profilePic: u.profilePicture,
        location: u.city ? `${u.city}, ${u.state}` : null,
        followersCount: stats.followerIds.length,
        followingCount: stats.followingIds.length,
        isFollowing,
        hasActiveStory: storyUserIds.has(uIdStr) && (
          req.user ? (isFollowing || isFollowedBy) : false
        )
      };
    });

    return res.status(200).json({ success: true, players });
  } catch (error) {
    logger.error("Error in searchPlayers:", error);
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

    const currentUserId = await resolveUserId(decoded.id);
    const targetUserId = await resolveUserId(id);

    await SocialService.followUser(currentUserId, targetUserId);

    return res.status(200).json({ 
      success: true, 
      message: "Followed successfully" 
    });
  } catch (error) {
    logger.error("Follow error:", error);
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

    const currentUserId = await resolveUserId(decoded.id);
    const targetUserId = await resolveUserId(id);

    await SocialService.unfollowUser(currentUserId, targetUserId);

    return res.status(200).json({ success: true, message: "Unfollowed successfully" });
  } catch (error) {
    logger.error("Unfollow error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getNetwork = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { followers, following } = await SocialService.getNetwork(currentUserId);

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
    const targetId = req.params.id;
    
    // Resolve identity (could be owner ID or user ID)
    let user = await prisma.user.findUnique({
      where: { id: targetId },
      include: { 
        ownerProfile: true,
        profile: true
      }
    });

    if (!user) {
      const owner = await prisma.ownerProfile.findUnique({
        where: { id: targetId },
        include: { user: { include: { ownerProfile: true } } }
      });
      if (owner?.user) {
        user = owner.user;
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const [bookingCount, followerIds, followingIds, userStats, wallet] = await Promise.all([
      prisma.booking.count({ where: { userId: user.id } }),
      SocialService.getFollowerIds(user.id),
      SocialService.getFollowingIds(user.id),
      prisma.userStats.findUnique({ where: { userId: user.id } }),
      WalletService.getWallet(user.id, user.role || 'user')
    ]);
    
    // Check for active stories
    const activeStory = await prisma.story.findFirst({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() }
      }
    });

    let hasActiveStory = false;
    if (activeStory) {
      const viewerId = req.user?.id;
      if (viewerId) {
        if (viewerId === user.id) {
          hasActiveStory = true;
        } else {
          const isFollowing = followerIds.includes(viewerId);
          const isFollowedBy = followingIds.includes(viewerId);
          if (isFollowing || isFollowedBy) {
            hasActiveStory = true;
          }
        }
      }
    }

    const ownerDoc = user.ownerProfile;

    const profile = user.profile || {};
    return res.status(200).json({ 
      success: true, 
      profile: {
        id: user.id,
        name: user.name,
        username: user.username || ownerDoc?.businessName || "Member",
        profilePicture: user.profilePicture,
        location: profile.city ? `${profile.city}, ${profile.state}` : (user.city ? `${user.city}, ${user.state}` : null),
        city: profile.city || user.city,
        state: profile.state || user.state,
        sportTypes: profile.sportTypes?.length ? profile.sportTypes : (user.sportTypes || []),
        bio: profile.bio || (ownerDoc?.businessName ? `Owner of ${ownerDoc.businessName}` : null),
        followers: followerIds,
        following: followingIds,
        interests: profile.interests || [],
        bookingCount,
        hasActiveStory: hasActiveStory,
        role: user.role,
        stats: {
          cricket: userStats?.cricket || { matches: 0, runs: 0, wickets: 0 }
        },
        badges: userStats?.badges || [],
        wallet: wallet,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error("Get profile error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getNetworkById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    const network = await SocialService.getNetwork(id);
    let { followers, following } = network;

    if (currentUserId) {
      const myNetwork = await SocialService.getNetwork(currentUserId);
      const myFollowing = myNetwork.following.map(u => u.id.toString());

      const sortWithCommon = (list) => {
        return [...list].sort((a, b) => {
          const aCommon = myFollowing.includes(a.id.toString());
          const bCommon = myFollowing.includes(b.id.toString());
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

    const stats = await prisma.userStats.findMany({
      where: {
        OR: [
          { cricket: { path: ['runs'], gte: 1 } },
          { cricket: { path: ['wickets'], gte: 1 } }
        ]
      },
      orderBy: category === 'bowling' 
        ? { cricket: { path: ['wickets'], sort: 'desc' } }
        : { cricket: { path: ['runs'], sort: 'desc' } },
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            profilePicture: true,
            city: true,
            state: true
          }
        }
      }
    });

    const rankedPlayers = stats.map((s, index) => ({
      id: s.userId,
      name: s.user.name,
      username: s.user.username,
      profilePicture: s.user.profilePicture,
      city: s.user.city,
      stats: {
        cricket: s.cricket,
        badges: s.badges
      },
      rank: index + 1
    }));

    return res.status(200).json({ success: true, players: rankedPlayers });
  } catch (error) {
    logger.error("Leaderboard error:", error);
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
    const players = await findNearby('User', parseFloat(lat), parseFloat(lng), parseFloat(radius), {
      where: { id: { not: req.user?.id } },
      take: parseInt(limit)
    });

    // Format for frontend (Decimal to Number)
    const formattedPlayers = players.map(p => ({
      ...p,
      id: p.id,
      lat: p.latitude ? parseFloat(String(p.latitude)) : null,
      lng: p.longitude ? parseFloat(String(p.longitude)) : null,
      distanceKm: null // PostGIS distance can be added if needed
    }));

    return res.status(200).json({ success: true, players: formattedPlayers });
  } catch (err) {
    logger.error("Nearby players error:", err);
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
      update = { latitude: null, longitude: null };
    } else if (lat && lng) {
      update = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        lastSeen: new Date()
      };
    } else {
      return res.status(400).json({ success: false, message: "Invalid location data" });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: update
      }),
      prisma.userProfile.upsert({
        where: { userId: userId },
        create: {
          userId: userId,
          latitude: update.latitude !== undefined ? update.latitude : undefined,
          longitude: update.longitude !== undefined ? update.longitude : undefined
        },
        update: {
          latitude: update.latitude !== undefined ? update.latitude : undefined,
          longitude: update.longitude !== undefined ? update.longitude : undefined
        }
      })
    ]);

    // Sync PostGIS geoPoint
    if (lat && lng && sharing !== false) {
      await updateGeoPoint('User', userId, parseFloat(lat), parseFloat(lng));
    }
    
    return res.status(200).json({ 
      success: true, 
      message: sharing ? "Location updated" : "Location cleared (Privacy mode)" 
    });
  } catch (err) {
    logger.error("Update location error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Update notification preferences for the logged-in user or owner
 */
export const updateNotificationPreferences = async (req, res) => {
  const { preferences } = req.body;
  const decoded = req.user || req.owner;

  if (!decoded) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (!preferences || typeof preferences !== 'object') {
    return res.status(400).json({ success: false, message: "Invalid preferences data" });
  }

  try {
    const currentUserId = decoded.id;
    
    const user = await prisma.user.findUnique({ where: { id: currentUserId } });
    if (user) {
      const updatedPrefs = { ...(user.notificationPreferences || {}), ...preferences };
      await prisma.user.update({
        where: { id: currentUserId },
        data: { notificationPreferences: updatedPrefs }
      });
      return res.status(200).json({ 
        success: true, 
        message: "Notification preferences updated", 
        preferences: updatedPrefs 
      });
    }

    const owner = await prisma.ownerProfile.findUnique({ where: { id: currentUserId } });
    if (owner) {
      const updatedPrefs = { ...(owner.notificationPreferences || {}), ...preferences };
      await prisma.ownerProfile.update({
        where: { id: currentUserId },
        data: { notificationPreferences: updatedPrefs }
      });
      return res.status(200).json({ 
        success: true, 
        message: "Notification preferences updated", 
        preferences: updatedPrefs 
      });
    }

    return res.status(404).json({ success: false, message: "User/Owner not found" });
  } catch (err) {
    logger.error("Update notification preferences error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
