import { prisma } from "../../config/prisma.js";
import SocialService from "../../services/social.service.js";
import WalletService from "../../services/wallet.service.js";
import { findNearby, updateGeoPoint } from "../../utils/geo.util.js";
import logger from "../../utils/logger.js";
import { getUserRecommendations } from "../../services/recommendation.service.js";
import redisClient from "../../config/redis.js";
import { isCanonicalSport, normalizeSport, SPORT_LIST } from "../../utils/sports.js";
import { rebuildAggregateForUser } from "../../services/playerReviewAggregator.service.js";
import { grantXp } from "../../services/xp.service.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";
import { readLeaderboardCache } from "../../services/leaderboardSnapshot.service.js";


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
    
    let currentUserId = null;
    if (req.user?.id) {
      currentUserId = await resolveUserId(req.user.id);
      where.id = { not: currentUserId };
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
      
      // Get real-time online users from Redis (who might not be in Postgres yet)
      let onlineUserIds = [];
      try {
        onlineUserIds = await redisClient.georadius("kridaz:geo:online", lng, lat, radius / 1000, "km") || [];
      } catch (err) {
        logger.error("Redis georadius error", err);
      }
      
      const postgresUserIds = new Set(nearbyUsers.map(u => u.id.toString()));
      if (currentUserId) postgresUserIds.add(currentUserId.toString());
      
      const missingUserIds = onlineUserIds.filter(id => !postgresUserIds.has(id));
      
      if (missingUserIds.length > 0) {
        const missingUsers = await prisma.user.findMany({
          where: { ...where, id: { in: missingUserIds } },
          include: { _count: { select: { bookings: true } } }
        });
        
        missingUsers.forEach(u => {
          u.distance = 0; // approximate distance for real-time users
          nearbyUsers.push(u);
        });
      }
      
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
        
        // Collect IDs the current user is following
        const currentUserFollowingIds = [];

        const players = nearbyUsers.map((u) => {
          const uIdStr = u.id;
          const stats = networkStats.get(uIdStr) || { followerIds: [], followingIds: [] };
          const isFollowing = currentUserId ? stats.followerIds.includes(currentUserId) : false;
          const isFollowedBy = currentUserId ? stats.followingIds.includes(currentUserId) : false;
          if (isFollowing) currentUserFollowingIds.push(uIdStr);
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
            followersCount: stats.followerIds.length,
            hasActiveStory: storyUserIds.has(uIdStr) && (req.user ? (isFollowing || isFollowedBy) : false),
            isFollowing
          };
        });
        return res.status(200).json({ success: true, players, followingIds: currentUserFollowingIds });
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
    
    // Collect IDs the current user is following
    const currentUserFollowingIds = [];

    const players = users.map((u) => {
      const uIdStr = u.id;
      const stats = networkStats.get(uIdStr) || { followerIds: [], followingIds: [] };
      
      const isFollowing = currentUserId ? stats.followerIds.includes(currentUserId) : false;
      const isFollowedBy = currentUserId ? stats.followingIds.includes(currentUserId) : false;
      if (isFollowing) currentUserFollowingIds.push(uIdStr);

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
        followersCount: stats.followerIds.length,
        hasActiveStory: storyUserIds.has(uIdStr) && (
          req.user ? (isFollowing || isFollowedBy) : false
        ),
        isFollowing
      };
    });

    return res.status(200).json({ success: true, players, followingIds: currentUserFollowingIds });
  } catch (err) {
    logger.error("Error in getPublicPlayers", err);
    return res.status(500).json({ message: err.message });
  }
};

export const searchPlayers = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    if (!query) {
      return res.status(200).json({ success: true, players: [] });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let currentUserId = null;
    if (req.user?.id) {
      currentUserId = await resolveUserId(req.user.id);
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } }
        ],
        ...(currentUserId ? { id: { not: currentUserId } } : {})
      },
      select: {
        id: true,
        name: true,
        username: true,
        profilePicture: true,
        city: true,
        state: true
      },
      skip,
      take
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
      
      const isFollowing = currentUserId ? stats.followerIds.includes(currentUserId) : false;
      const isFollowedBy = currentUserId ? stats.followingIds.includes(currentUserId) : false;

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
        ownerProfile: true
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
    
    const [bookingCount, followerIds, followingIds, userStats, wallet, careerStats, achievements, matchHistory, teams, network, liveMatches] = await Promise.all([
      prisma.booking.count({ where: { userId: user.id } }),
      SocialService.getFollowerIds(user.id),
      SocialService.getFollowingIds(user.id),
      prisma.userStats.findUnique({ where: { userId: user.id } }),
      WalletService.getWallet(user.id, user.role || 'user'),
      prisma.playerCareerStats.findMany({ where: { userId: user.id } }),
      prisma.userAchievement.findMany({
        where: { userId: user.id },
        include: { achievement: true },
        orderBy: { awardedAt: 'desc' },
      }),
      prisma.hostedGame.findMany({
        where: {
          scoringStatus: "COMPLETED",
          teams: {
            some: {
              slots: {
                some: {
                  userId: user.id
                }
              }
            }
          }
        },
        include: {
          teams: {
            include: {
              slots: {
                include: {
                  user: { select: { id: true, name: true, profilePicture: true } }
                }
              }
            }
          },
          turf: true,
          cricketMatch: {
            include: {
              innings: true,
              playerStats: {
                where: {
                  userId: user.id
                }
              }
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      }),
      prisma.team.findMany({
        where: {
          OR: [
            { ownerId: user.id },
            { members: { some: { userId: user.id, status: "JOINED" } } }
          ]
        },
        select: {
          id: true,
          name: true,
          logo: true,
          image: true,
          teamCode: true,
          sportType: true,
          captainName: true,
          city: true
        }
      }),
      SocialService.getNetwork(user.id),
      // Live matches: games currently in progress where the user is a participant
      prisma.hostedGame.findMany({
        where: {
          isLive: true,
          scoringStatus: { in: ["LIVE", "PAUSED"] },
          teams: {
            some: {
              slots: {
                some: { userId: user.id }
              }
            }
          }
        },
        select: {
          id: true,
          gameType: true,
          format: true,
          city: true,
          customVenue: true,
          liveStartedAt: true,
          teams: {
            select: {
              id: true,
              name: true,
              teamKey: true
            }
          },
          turf: {
            select: { name: true, city: true }
          }
        }
      })
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
        careerStats: careerStats,
        badges: achievements,
        achievements,
        matchHistory: matchHistory,
        teams: teams,
        liveMatches: liveMatches,
        followersList: network?.followers || [],
        followingList: network?.following || [],
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

/**
 * Get nearby players for the Live Map
 * Optimized for map data payload
 */
/**
 * Public-safe fields for the discovery payload. Anything not in this allowlist
 * never leaves the server — keeps password/fcmToken/googleId/email/phone/
 * notificationPreferences/socialAccounts/etc. out of an endpoint that's
 * reachable with an OPTIONAL auth token (so a logged-out scraper could
 * otherwise enumerate users near a coordinate).
 */
const NEARBY_PLAYER_FIELDS = {
  id: true,
  name: true,
  username: true,
  profilePicture: true,
  bio: true,
  city: true,
  state: true,
  role: true,
  sportTypes: true,
  interests: true,
  lastSeen: true,
  latitude: true,
  longitude: true,
};

export const getNearbyPlayers = async (req, res) => {
  const { lat, lng, radius, limit } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ success: false, message: "Location coordinates required" });
  }

  const safeLat = parseFloat(lat);
  const safeLng = parseFloat(lng);
  if (!Number.isFinite(safeLat) || !Number.isFinite(safeLng) ||
      safeLat < -90 || safeLat > 90 || safeLng < -180 || safeLng > 180) {
    return res.status(400).json({ success: false, message: "Invalid coordinates" });
  }

  // Clamp untrusted query params so callers can't scrape the user table.
  const safeRadius = Math.min(Math.max(parseFloat(radius) || 5000, 100), 100_000); // meters
  const safeLimit  = Math.min(Math.max(parseInt(limit) || 50, 1), 200);

  try {
    const viewerId = req.user?.id || null;
    const whereClause = viewerId
      ? { id: { not: viewerId }, locationSharingEnabled: { not: false } }
      : { locationSharingEnabled: { not: false } };

    const players = await findNearby('User', safeLat, safeLng, safeRadius, {
      where: whereClause,
      take: safeLimit,
      select: NEARBY_PLAYER_FIELDS,
    });

    // For an authed viewer, fetch the subset of these targets the viewer
    // already follows in one query. Anonymous viewers always get false.
    let followedSet = new Set();
    if (viewerId && players.length) {
      const follows = await prisma.userRelationship.findMany({
        where: {
          userId: viewerId,
          targetId: { in: players.map(p => p.id) },
          type: "FOLLOW",
        },
        select: { targetId: true },
      });
      followedSet = new Set(follows.map(f => f.targetId));
    }

    // Format for frontend (Decimal to Number, meters → km) + follow flag.
    const formattedPlayers = players.map(p => ({
      ...p,
      lat: p.latitude != null ? parseFloat(String(p.latitude)) : null,
      lng: p.longitude != null ? parseFloat(String(p.longitude)) : null,
      distanceKm: p.distance != null ? p.distance / 1000 : null,
      isFollowing: followedSet.has(p.id),
    }));

    // Wrapped envelope (additive) so new clients can read `data.players` directly.
    return res.status(200).json({
      success: true,
      players: formattedPlayers,
      data: { players: formattedPlayers },
    });
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

  const sharingEnabled = sharing !== false;

  try {
    let update = { locationSharingEnabled: sharingEnabled };

    if (!sharingEnabled || (lat === 0 && lng === 0)) {
      // Clear location for privacy
      update.latitude = null;
      update.longitude = null;
    } else if (lat && lng) {
      const safeLat = parseFloat(lat);
      const safeLng = parseFloat(lng);
      if (!Number.isFinite(safeLat) || !Number.isFinite(safeLng) ||
          safeLat < -90 || safeLat > 90 || safeLng < -180 || safeLng > 180) {
        return res.status(400).json({ success: false, message: "Invalid coordinates" });
      }
      update.latitude = safeLat;
      update.longitude = safeLng;
      update.lastSeen = new Date();
    } else {
      return res.status(400).json({ success: false, message: "Invalid location data" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: update
    });

    if (sharingEnabled && update.latitude != null && update.longitude != null) {
      await updateGeoPoint('User', userId, update.latitude, update.longitude);
    } else {
      // Privacy ON: purge this user from live discovery state so they vanish from active maps.
      try {
        await Promise.all([
          redisClient.del(`kridaz:location:${userId}`),
          redisClient.zrem("kridaz:geo:online", userId.toString())
        ]);
      } catch (e) {
        logger.warn("Failed to purge geo state on privacy toggle:", e?.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: sharingEnabled ? "Location updated" : "Location cleared (Privacy mode)"
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

/**
 * Fetch personalized follow recommendations for the player
 */
export const getPlayerRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lat, lng, limit = 10 } = req.query;

    const recommendedUsers = await getUserRecommendations(userId, lat, lng, limit);
    if (!recommendedUsers || recommendedUsers.length === 0) {
      return res.status(200).json({ success: true, players: [] });
    }

    const userIds = recommendedUsers.map(u => u.id);

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

    const players = recommendedUsers.map((u) => {
      const uIdStr = u.id;
      const stats = networkStats.get(uIdStr) || { followerIds: [], followingIds: [] };
      const isFollowing = stats.followerIds.includes(userId.toString());
      const isFollowedBy = stats.followingIds.includes(userId.toString());

      return {
        id: u.id,
        _id: u.id,
        name: u.name,
        username: u.username,
        profilePicture: u.profilePicture,
        profilePic: u.profilePicture,
        sportTypes: u.sportTypes || [],
        followersCount: stats.followerIds.length,
        followingCount: stats.followingIds.length,
        isFollowing,
        hasActiveStory: storyUserIds.has(uIdStr) && (isFollowing || isFollowedBy),
        totalScore: u.totalScore
      };
    });

    return res.status(200).json({ success: true, players });
  } catch (error) {
    logger.error("Error in getPlayerRecommendations:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 — Player Profile stats / matches / activity
// ─────────────────────────────────────────────────────────────────────────────

// Privacy gate. Public stats: anyone. Private: only the owner.
// (Block check goes here once BlockedUser is wired into requests — Phase 6.)
const canViewStats = (targetUser, viewerId) => {
  if (!targetUser) return false;
  if (viewerId && viewerId === targetUser.id) return true;
  const flags = targetUser.privacyFlags || {};
  return flags.statsPublic !== false;
};

/**
 * GET /api/user/players/:id/stats?sport=CRICKET
 * Returns per-sport deep stats. Without ?sport, returns one row per sport
 * the user has played.
 */
export const getPlayerStats = async (req, res) => {
  try {
    const targetId = await resolveUserId(req.params.id);
    const viewerId = req.user?.id ? await resolveUserId(req.user.id) : null;

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, privacyFlags: true }
    });
    if (!target) return res.status(404).json({ success: false, message: "User not found" });
    if (!canViewStats(target, viewerId)) {
      return res.status(403).json({ success: false, message: "This player's stats are private" });
    }

    const sportParam = req.query.sport;
    let sport = null;
    if (sportParam) {
      sport = isCanonicalSport(sportParam) ? sportParam : normalizeSport(sportParam);
      if (!sport) {
        return res.status(400).json({
          success: false,
          message: `Unknown sport "${sportParam}". Allowed: ${SPORT_LIST.join(", ")}`
        });
      }
    }

    const rows = await prisma.playerCareerStats.findMany({
      where: { userId: target.id, ...(sport ? { sportType: sport } : {}) }
    });

    // Recent form: last 5 MatchParticipant rows for this user (filtered by
    // sport if requested). Stat row carries the totals; recent-form needs the
    // event log.
    const recentForm = await prisma.matchParticipant.findMany({
      where: { userId: target.id, ...(sport ? { sport } : {}) },
      orderBy: { playedAt: 'desc' },
      take: 5,
      select: { result: true }
    });

    return res.status(200).json({
      success: true,
      sport,
      stats: rows,
      recentForm: recentForm.map(r =>
        r.result === 'won' ? 'W' : r.result === 'lost' ? 'L' : r.result === 'draw' ? 'D' : '?'
      )
    });
  } catch (err) {
    logger.error("getPlayerStats error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/user/players/:id/matches?sport=&cursor=&limit=20
 * Paginated recent matches via MatchParticipant.
 */
export const getPlayerMatches = async (req, res) => {
  try {
    const targetId = await resolveUserId(req.params.id);
    const viewerId = req.user?.id ? await resolveUserId(req.user.id) : null;

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, privacyFlags: true }
    });
    if (!target) return res.status(404).json({ success: false, message: "User not found" });
    if (!canViewStats(target, viewerId)) {
      return res.status(403).json({ success: false, message: "This player's stats are private" });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const cursor = req.query.cursor || null;
    const sportParam = req.query.sport;
    const sport = sportParam
      ? (isCanonicalSport(sportParam) ? sportParam : normalizeSport(sportParam))
      : null;

    const where = {
      userId: target.id,
      ...(sport ? { sport } : {}),
    };

    const rows = await prisma.matchParticipant.findMany({
      where,
      orderBy: { playedAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? page[page.length - 1].id : null;

    return res.status(200).json({
      success: true,
      matches: page,
      nextCursor,
    });
  } catch (err) {
    logger.error("getPlayerMatches error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/user/players/:id/activity?window=90d
 * Returns the activity heatmap: per-day minutes/match counts, weekday
 * histogram, most-active-day, and peak hour. Window: 30d / 90d / 365d.
 */
export const getPlayerActivity = async (req, res) => {
  try {
    const targetId = await resolveUserId(req.params.id);
    const viewerId = req.user?.id ? await resolveUserId(req.user.id) : null;

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true, privacyFlags: true }
    });
    if (!target) return res.status(404).json({ success: false, message: "User not found" });
    if (!canViewStats(target, viewerId)) {
      return res.status(403).json({ success: false, message: "This player's stats are private" });
    }

    const window = req.query.window || '90d';
    const days = window === '30d' ? 30 : window === '365d' ? 365 : 90;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await prisma.matchParticipant.findMany({
      where: { userId: target.id, playedAt: { gte: since } },
      select: { playedAt: true, minutesPlayed: true }
    });

    const dayBuckets = new Map();              // YYYY-MM-DD -> { minutes, matches }
    const weekday = { sun:0, mon:0, tue:0, wed:0, thu:0, fri:0, sat:0 };
    const hourCounts = new Array(24).fill(0);

    for (const r of rows) {
      const d = new Date(r.playedAt);
      const dayKey = d.toISOString().slice(0, 10);
      const bucket = dayBuckets.get(dayKey) ?? { minutes: 0, matches: 0 };
      bucket.matches += 1;
      bucket.minutes += r.minutesPlayed || 0;
      dayBuckets.set(dayKey, bucket);

      const dow = ['sun','mon','tue','wed','thu','fri','sat'][d.getUTCDay()];
      weekday[dow] += 1;
      hourCounts[d.getUTCHours()] += 1;
    }

    const perDay = Array.from(dayBuckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, minutes: v.minutes, matches: v.matches }));

    const mostActiveDay = Object.entries(weekday).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    return res.status(200).json({
      success: true,
      window,
      perDay,
      weekdayHistogram: weekday,
      mostActiveDay,
      peakHour: hourCounts[peakHour] > 0 ? peakHour : null,
    });
  } catch (err) {
    logger.error("getPlayerActivity error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// Phase 3 — Peer reviews
// ─────────────────────────────────────────────────────────────────────────────

const RATING_FIELDS = ['sportsmanship', 'punctuality', 'skill'];

// Reviewer is eligible if they actually participated in the match. We accept
// either a MatchParticipant row (sport-agnostic) or a HostedGame slot (covers
// matches that never got aggregated yet — review window is post-game, but
// aggregation might still be queued).
async function reviewerPlayedMatch(matchId, userId) {
  const fromParticipant = await prisma.matchParticipant.findFirst({
    where: { matchId, userId },
    select: { id: true },
  });
  if (fromParticipant) return true;

  // matchId might be a cricketMatch.id; resolve back to hostedGame and check slots.
  const cricket = await prisma.cricketMatch.findUnique({
    where: { id: matchId },
    select: { gameId: true },
  });
  const hostedGameId = cricket?.gameId ?? matchId;
  const slot = await prisma.gameSlot.findFirst({
    where: { gameId: hostedGameId, userId },
    select: { id: true },
  });
  return !!slot;
}

/**
 * POST /api/user/players/match/:matchId/review
 * Bulk-submit peer reviews after a match. Body: { reviews: [{ revieweeId,
 * sportsmanship, punctuality, skill, tags?, note? }] }. Reviewer is taken
 * from auth.
 *
 * - Rejects if reviewer didn't play in the match.
 * - Rejects self-review.
 * - Duplicates (matchId, reviewer, reviewee) raise a 409 with the offending ids.
 * - All ratings must be 1..5.
 */
export const submitMatchReviews = async (req, res) => {
  try {
    const reviewerId = req.user?.id ? await resolveUserId(req.user.id) : null;
    if (!reviewerId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const matchId = req.params.matchId;
    if (!matchId) return res.status(400).json({ success: false, message: "matchId required" });

    const incoming = Array.isArray(req.body?.reviews) ? req.body.reviews : [];
    if (incoming.length === 0) {
      return res.status(400).json({ success: false, message: "reviews[] required" });
    }
    if (incoming.length > 30) {
      return res.status(400).json({ success: false, message: "Too many reviews in one request (max 30)" });
    }

    const cleaned = [];
    for (const r of incoming) {
      if (!r?.revieweeId) {
        return res.status(400).json({ success: false, message: "Every review needs a revieweeId" });
      }
      if (r.revieweeId === reviewerId) {
        return res.status(400).json({ success: false, message: "You cannot review yourself" });
      }
      for (const f of RATING_FIELDS) {
        const v = r[f];
        if (!Number.isInteger(v) || v < 1 || v > 5) {
          return res.status(400).json({ success: false, message: `Review.${f} must be an integer 1..5` });
        }
      }
      cleaned.push({
        matchId,
        reviewerId,
        revieweeId: r.revieweeId,
        sportsmanship: r.sportsmanship,
        punctuality: r.punctuality,
        skill: r.skill,
        tags: Array.isArray(r.tags) ? r.tags.slice(0, 10).map(String) : [],
        note: r.note ? String(r.note).slice(0, 200) : null,
      });
    }

    const eligible = await reviewerPlayedMatch(matchId, reviewerId);
    if (!eligible) {
      return res.status(403).json({ success: false, message: "Only match participants can submit reviews" });
    }

    // Optional cricketMatch -> hostedGame resolution so the FK column lights up
    // for analytics.
    const cricket = await prisma.cricketMatch.findUnique({
      where: { id: matchId },
      select: { gameId: true },
    });
    const hostedGameId = cricket?.gameId ?? null;

    const created = [];
    const conflicts = [];
    for (const row of cleaned) {
      try {
        const rec = await prisma.playerReview.create({
          data: { ...row, hostedGameId },
        });
        created.push(rec);
      } catch (err) {
        if (err?.code === 'P2002') {
          // unique(matchId, reviewerId, revieweeId)
          conflicts.push(row.revieweeId);
        } else {
          throw err;
        }
      }
    }

    // Incremental aggregate refresh — one per unique reviewee touched.
    const touchedReviewees = [...new Set(created.map(r => r.revieweeId))];
    await Promise.all(touchedReviewees.map(rebuildAggregateForUser));

    // Phase 4: 5 XP per review actually written (cap at 25 to deter spam).
    if (created.length > 0) {
      const amount = Math.min(created.length * 5, 25);
      grantXp({ userId: reviewerId, source: 'review', amount, referenceId: matchId })
        .catch(err => logger.warn('[REVIEW] Failed to grant review XP:', err?.message));
    }

    return res.status(201).json({
      success: true,
      created,
      conflicts, // revieweeIds the user had already reviewed for this match
    });
  } catch (err) {
    logger.error("submitMatchReviews error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 5 — Media gallery + cover image
// ─────────────────────────────────────────────────────────────────────────────

const MAX_PHOTO_BYTES   = 5  * 1024 * 1024;   // 5MB
const MAX_COVER_BYTES   = 8  * 1024 * 1024;   // 8MB
const MAX_PINNED_PHOTOS = 4;                  // cap pin spam

/**
 * POST /api/user/players/me/cover
 * Cloudinary upload, sets User.coverImage. Uses the same multer middleware
 * as profile-picture (memoryStorage), so req.file.buffer is the source.
 */
export const updateCoverImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }
    if (req.file.size > MAX_COVER_BYTES) {
      return res.status(413).json({ success: false, message: "Cover image exceeds 8MB limit" });
    }
    const userId = req.user?.id ? await resolveUserId(req.user.id) : null;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const url = await uploadToCloudinary(req.file.buffer, `kridaz/players/${userId}/cover`);
    await prisma.user.update({ where: { id: userId }, data: { coverImage: url } });

    return res.status(200).json({ success: true, coverImage: url });
  } catch (err) {
    logger.error("updateCoverImage error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/user/players/me/media
 * Upload a profile-gallery photo. Body multipart: file=image, caption?, tags?,
 * matchId?. Returns the created PlayerMedia row.
 */
export const uploadPlayerMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }
    if (req.file.size > MAX_PHOTO_BYTES) {
      return res.status(413).json({ success: false, message: "Photo exceeds 5MB limit" });
    }
    if (!req.file.mimetype?.startsWith("image/")) {
      return res.status(400).json({ success: false, message: "Only images are accepted on /media" });
    }

    const userId = req.user?.id ? await resolveUserId(req.user.id) : null;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const url = await uploadToCloudinary(req.file.buffer, `kridaz/players/${userId}/photos`);

    const caption = req.body?.caption ? String(req.body.caption).slice(0, 200) : null;
    const matchId = req.body?.matchId ? String(req.body.matchId) : null;
    const tags = (() => {
      const raw = req.body?.tags;
      if (!raw) return [];
      if (Array.isArray(raw)) return raw.slice(0, 10).map(String);
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.slice(0, 10).map(String) : [];
      } catch {
        return String(raw).split(',').slice(0, 10).map(s => s.trim()).filter(Boolean);
      }
    })();

    const media = await prisma.playerMedia.create({
      data: { userId, type: 'photo', url, caption, tags, matchId },
    });
    return res.status(201).json({ success: true, media });
  } catch (err) {
    logger.error("uploadPlayerMedia error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/user/players/:id/media?type=photo|reel&cursor=&limit=
 * Profile gallery. Photos come from PlayerMedia; reels come from the existing
 * Reel table (creatorId match). Without ?type returns photos first, then a
 * separate reels array — clients render them in tabs.
 */
export const getPlayerMedia = async (req, res) => {
  try {
    const targetId = await resolveUserId(req.params.id);
    if (!targetId) return res.status(400).json({ success: false, message: "Invalid user id" });

    const type = req.query.type;
    const limit = Math.min(parseInt(req.query.limit, 10) || 24, 60);
    const cursor = req.query.cursor || null;

    if (type === 'reel') {
      const reels = await prisma.reel.findMany({
        where: { creatorId: targetId, status: 'ready', isPrivate: false },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });
      const hasMore = reels.length > limit;
      const items = hasMore ? reels.slice(0, limit) : reels;
      return res.status(200).json({
        success: true,
        type: 'reel',
        reels: items,
        nextCursor: hasMore ? items[items.length - 1].id : null,
      });
    }

    // Default: photos via PlayerMedia. Pinned first, then newest.
    const photos = await prisma.playerMedia.findMany({
      where: { userId: targetId, type: 'photo' },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    const hasMore = photos.length > limit;
    const items = hasMore ? photos.slice(0, limit) : photos;

    return res.status(200).json({
      success: true,
      type: 'photo',
      photos: items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch (err) {
    logger.error("getPlayerMedia error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/user/players/me/media/:mediaId
 * Owner-only. Update caption / isPinned / tags. Cap on simultaneously pinned
 * photos to keep the profile gallery tidy.
 */
export const updatePlayerMedia = async (req, res) => {
  try {
    const userId = req.user?.id ? await resolveUserId(req.user.id) : null;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const media = await prisma.playerMedia.findUnique({ where: { id: req.params.mediaId } });
    if (!media) return res.status(404).json({ success: false, message: "Media not found" });
    if (media.userId !== userId) {
      return res.status(403).json({ success: false, message: "You can only edit your own media" });
    }

    const patch = {};
    if (typeof req.body?.caption === 'string') patch.caption = req.body.caption.slice(0, 200);
    if (Array.isArray(req.body?.tags))         patch.tags = req.body.tags.slice(0, 10).map(String);
    if (typeof req.body?.isPinned === 'boolean') patch.isPinned = req.body.isPinned;

    if (patch.isPinned === true && !media.isPinned) {
      const pinnedCount = await prisma.playerMedia.count({
        where: { userId, isPinned: true },
      });
      if (pinnedCount >= MAX_PINNED_PHOTOS) {
        return res.status(409).json({
          success: false,
          message: `Pin limit reached (${MAX_PINNED_PHOTOS}). Unpin one first.`
        });
      }
    }

    const updated = await prisma.playerMedia.update({ where: { id: media.id }, data: patch });
    return res.status(200).json({ success: true, media: updated });
  } catch (err) {
    logger.error("updatePlayerMedia error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/user/players/me/media/:mediaId
 * Owner-only. Removes the row; Cloudinary cleanup is best-effort (the URL
 * doesn't carry the public_id, so we only delete it if the path matches the
 * known folder prefix).
 */
export const deletePlayerMedia = async (req, res) => {
  try {
    const userId = req.user?.id ? await resolveUserId(req.user.id) : null;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const media = await prisma.playerMedia.findUnique({ where: { id: req.params.mediaId } });
    if (!media) return res.status(404).json({ success: false, message: "Media not found" });
    if (media.userId !== userId) {
      return res.status(403).json({ success: false, message: "You can only delete your own media" });
    }

    await prisma.playerMedia.delete({ where: { id: media.id } });

    // Best-effort Cloudinary cleanup. URL format:
    //   https://res.cloudinary.com/<cloud>/image/upload/v123/kridaz/players/<userId>/photos/<id>.jpg
    try {
      const { v2: cloudinary } = await import('cloudinary');
      const m = media.url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z]+$/);
      if (m && m[1]?.startsWith(`kridaz/players/${userId}/`)) {
        await cloudinary.uploader.destroy(m[1]).catch(() => {});
      }
    } catch (cleanupErr) {
      logger.warn('[PLAYER_MEDIA] Cloudinary cleanup failed:', cleanupErr?.message);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error("deletePlayerMedia error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


/**
 * GET /api/user/players/:id/achievements
 * Returns trophies/badges earned, newest first, with catalog metadata joined.
 */
export const getPlayerAchievements = async (req, res) => {
  try {
    const targetId = await resolveUserId(req.params.id);
    if (!targetId) return res.status(400).json({ success: false, message: "Invalid user id" });

    const rows = await prisma.userAchievement.findMany({
      where: { userId: targetId },
      orderBy: { awardedAt: 'desc' },
      include: { achievement: true },
    });

    return res.status(200).json({ success: true, achievements: rows });
  } catch (err) {
    logger.error("getPlayerAchievements error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/user/leaderboard?sport=&city=&window=month&limit=
 * Per-sport per-city rank by playerRating, tie-broken by matchesPlayed.
 * Spec section 5 calls for a Redis-cached hourly snapshot; this is the
 * live-query fallback that the snapshot will eventually back.
 */
export const getLeaderboard = async (req, res) => {
  try {
    const sportParam = req.query.sport;
    if (!sportParam) {
      return res.status(400).json({ success: false, message: "?sport= required" });
    }
    const sport = isCanonicalSport(sportParam) ? sportParam : normalizeSport(sportParam);
    if (!sport) {
      return res.status(400).json({
        success: false,
        message: `Unknown sport "${sportParam}". Allowed: ${SPORT_LIST.join(", ")}`
      });
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const cityRaw = req.query.city ? String(req.query.city).trim() : null;

    // Read-through cache: snapshot job pre-computes top 100 per (sport, city)
    // plus a global per-sport blob. We slice to the requested limit.
    // Snapshots key on exact city match (case-sensitive) — fall through to the
    // live query if the query used a case-insensitive contains filter.
    if (cityRaw === null || /^[A-Za-z][A-Za-z\s.'-]*$/.test(cityRaw)) {
      const cached = await readLeaderboardCache(sport, cityRaw);
      if (cached) {
        return res.status(200).json({
          success: true,
          sport,
          leaderboard: cached.slice(0, limit),
          source: 'cache',
        });
      }
    }

    const cityFilter = cityRaw
      ? { city: { contains: cityRaw, mode: 'insensitive' } }
      : {};

    const rows = await prisma.playerCareerStats.findMany({
      where: {
        sportType: sport,
        user: { ...cityFilter, status: 'active' },
      },
      include: {
        user: { select: { id: true, name: true, username: true, profilePicture: true, city: true } },
      },
      orderBy: [
        { playerRating: 'desc' },
        { matchesPlayed: 'desc' },
      ],
      take: limit,
    });

    const leaderboard = rows.map((r, idx) => ({
      rank: idx + 1,
      user: r.user,
      playerRating: r.playerRating,
      matchesPlayed: r.matchesPlayed,
      matchesWon: r.matchesWon,
      winPercentage: r.winPercentage,
    }));

    return res.status(200).json({ success: true, sport, leaderboard, source: 'live' });
  } catch (err) {
    logger.error("getLeaderboard error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/user/players/:id/reviews?cursor=&limit=
 * Paginated reviews received by :id, plus the aggregate roll-up.
 */
export const getPlayerReviews = async (req, res) => {
  try {
    const targetId = await resolveUserId(req.params.id);
    if (!targetId) return res.status(400).json({ success: false, message: "Invalid user id" });

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const cursor = req.query.cursor || null;

    const [aggregate, page] = await Promise.all([
      prisma.playerReviewAggregate.findUnique({ where: { userId: targetId } }),
      prisma.playerReview.findMany({
        where: { revieweeId: targetId },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: {
          reviewer: { select: { id: true, name: true, username: true, profilePicture: true } },
        },
      }),
    ]);

    const hasMore = page.length > limit;
    const items = hasMore ? page.slice(0, limit) : page;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return res.status(200).json({
      success: true,
      aggregate: aggregate ?? {
        userId: targetId,
        avgSportsmanship: null,
        avgPunctuality: null,
        avgSkill: null,
        reviewCount: 0,
        topTags: [],
      },
      reviews: items,
      nextCursor,
    });
  } catch (err) {
    logger.error("getPlayerReviews error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


// ════════════════════════════════════════════════════════════════════════════
// Phase 6 — Discovery, who-viewed-me, report, block
// ════════════════════════════════════════════════════════════════════════════

const DISCOVER_PAGE_MAX = 50;
const VIEWERS_PAGE_MAX = 50;
const REPORT_REASONS = new Set([
  'inappropriate_content', 'harassment', 'spam',
  'impersonation', 'underage', 'safety', 'other',
]);

const dayBucketUtc = (d = new Date()) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

/**
 * GET /api/user/players/discover
 * Faceted discovery: name/username, sport, city, state, minRating, skillLevel.
 * Honors privacyFlags.discoverable and excludes anyone the viewer has blocked
 * or who has blocked the viewer.
 *
 * Returns cursor pagination (id desc) — sort by id, not score, so the cursor
 * is stable across runs (relevance ranking would require a search index).
 */
export const discoverPlayers = async (req, res) => {
  try {
    const {
      q,
      sport,
      city,
      state,
      minRating,
      skillLevel,
      cursor,
      limit,
    } = req.query;

    const take = Math.min(parseInt(limit) || 20, DISCOVER_PAGE_MAX);
    const viewerId = req.user?.id ? await resolveUserId(req.user.id) : null;

    const where = { AND: [] };

    if (q) {
      where.AND.push({
        OR: [
          { name:     { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    if (sport) {
      const canonical = normalizeSport(sport);
      if (canonical) where.AND.push({ sportTypes: { has: canonical } });
    }

    if (city)  where.AND.push({ city:  { equals: city,  mode: 'insensitive' } });
    if (state) where.AND.push({ state: { equals: state, mode: 'insensitive' } });

    // Exclude viewer + anyone in a bidirectional block with viewer.
    if (viewerId) {
      const blockRows = await prisma.blockedUser.findMany({
        where: { OR: [{ blockerId: viewerId }, { blockedId: viewerId }] },
        select: { blockerId: true, blockedId: true },
      });
      const blockedIds = new Set();
      for (const b of blockRows) {
        blockedIds.add(b.blockerId === viewerId ? b.blockedId : b.blockerId);
      }
      blockedIds.add(viewerId);
      where.AND.push({ id: { notIn: [...blockedIds] } });
    }

    if (cursor) where.AND.push({ id: { lt: cursor } });

    // Drop empty AND so Prisma doesn't reject.
    if (!where.AND.length) delete where.AND;

    const rows = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        profilePicture: true,
        coverImage: true,
        city: true,
        state: true,
        sportTypes: true,
        skillLevels: true,
        level: true,
        xp: true,
        privacyFlags: true,
        reviewAggregate: {
          select: { avgSkill: true, reviewCount: true, avgSportsmanship: true },
        },
      },
      orderBy: { id: 'desc' },
      take: take + 1,
    });

    // Filter out anyone who opted out of discovery, then apply post-filters
    // that need joined data (minRating, skillLevel).
    const filtered = rows.filter((u) => {
      if (u.privacyFlags?.discoverable === false) return false;

      if (minRating) {
        const r = u.reviewAggregate?.avgSkill;
        if (r == null || r < parseFloat(minRating)) return false;
      }
      if (skillLevel && sport) {
        const lvl = u.skillLevels?.[normalizeSport(sport)];
        if (lvl !== skillLevel) return false;
      }
      return true;
    });

    const hasMore = filtered.length > take;
    const slice = hasMore ? filtered.slice(0, take) : filtered;
    const nextCursor = hasMore ? slice[slice.length - 1].id : null;

    const players = slice.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      profilePicture: u.profilePicture,
      coverImage: u.coverImage,
      city: u.city,
      state: u.state,
      sports: u.sportTypes,
      level: u.level,
      rating: u.reviewAggregate?.avgSkill ?? null,
      reviewCount: u.reviewAggregate?.reviewCount ?? 0,
    }));

    return res.status(200).json({ success: true, players, nextCursor });
  } catch (err) {
    logger.error("discoverPlayers error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/user/players/:id/view
 * Records a profile view (deduped to once per viewer-target per UTC day).
 * Bumps target.profileViewsCount only on the first dedup-window hit so the
 * count tracks unique daily viewers, not raw page loads.
 */
export const recordProfileView = async (req, res) => {
  try {
    const viewerId = req.user?.id ? await resolveUserId(req.user.id) : null;
    if (!viewerId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const targetId = await resolveUserId(req.params.id);
    if (!targetId) return res.status(404).json({ success: false, message: "User not found" });
    if (targetId === viewerId) return res.status(200).json({ success: true, deduped: true });

    const dayBucket = dayBucketUtc();
    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.profileView.upsert({
        where: {
          viewerId_viewedId_dayBucket: { viewerId, viewedId: targetId, dayBucket },
        },
        update: {},
        create: { viewerId, viewedId: targetId, dayBucket },
        select: { viewedAt: true, viewerId: true },
      });

      // Upsert returns the existing row when present; detect "first today"
      // via createdAt = viewedAt being within the last second of this call.
      const isFresh = Date.now() - new Date(created.viewedAt).getTime() < 2000;
      if (isFresh) {
        await tx.user.update({
          where: { id: targetId },
          data: { profileViewsCount: { increment: 1 } },
        });
      }
      return { isFresh };
    });

    return res.status(200).json({ success: true, fresh: result.isFresh });
  } catch (err) {
    logger.error("recordProfileView error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/user/players/me/viewers
 * Recent unique viewers of the authenticated user's profile. Honors
 * privacyFlags.profileViewsPublic on each viewer (private viewers are returned
 * as anonymous placeholders so the count remains honest).
 */
export const getMyViewers = async (req, res) => {
  try {
    const meId = req.user?.id ? await resolveUserId(req.user.id) : null;
    if (!meId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const take = Math.min(parseInt(req.query.limit) || 20, VIEWERS_PAGE_MAX);
    const cursor = req.query.cursor;

    const views = await prisma.profileView.findMany({
      where: {
        viewedId: meId,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: { viewedAt: 'desc' },
      take: take + 1,
      include: {
        viewer: {
          select: {
            id: true, name: true, username: true, profilePicture: true,
            privacyFlags: true,
          },
        },
      },
    });

    const hasMore = views.length > take;
    const slice = hasMore ? views.slice(0, take) : views;
    const nextCursor = hasMore ? slice[slice.length - 1].id : null;

    const viewers = slice.map((v) => {
      const showIdentity = v.viewer?.privacyFlags?.profileViewsPublic !== false;
      return showIdentity ? {
        id: v.viewer.id,
        name: v.viewer.name,
        username: v.viewer.username,
        profilePicture: v.viewer.profilePicture,
        viewedAt: v.viewedAt,
      } : {
        id: null,
        name: 'Anonymous',
        username: null,
        profilePicture: null,
        viewedAt: v.viewedAt,
      };
    });

    return res.status(200).json({ success: true, viewers, nextCursor });
  } catch (err) {
    logger.error("getMyViewers error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/user/players/:id/report
 * Body: { reason, details? }
 * One pending report per reporter-target pair (later reports become
 * follow-ups by appending to details). Reason must be in the closed set.
 */
export const reportPlayer = async (req, res) => {
  try {
    const reporterId = req.user?.id ? await resolveUserId(req.user.id) : null;
    if (!reporterId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const reportedId = await resolveUserId(req.params.id);
    if (!reportedId) return res.status(404).json({ success: false, message: "User not found" });
    if (reportedId === reporterId) {
      return res.status(400).json({ success: false, message: "You cannot report yourself" });
    }

    const reason = (req.body?.reason || '').toString();
    if (!REPORT_REASONS.has(reason)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reason",
        allowed: [...REPORT_REASONS],
      });
    }
    const details = req.body?.details ? String(req.body.details).slice(0, 2000) : null;

    const existing = await prisma.userReport.findFirst({
      where: { reporterId, reportedId, status: 'PENDING' },
      select: { id: true, details: true },
    });

    let report;
    if (existing) {
      const merged = [existing.details, details].filter(Boolean).join('\n---\n').slice(0, 4000);
      report = await prisma.userReport.update({
        where: { id: existing.id },
        data: { reason, details: merged || null },
      });
    } else {
      report = await prisma.userReport.create({
        data: { reporterId, reportedId, reason, details },
      });
    }

    return res.status(200).json({ success: true, reportId: report.id });
  } catch (err) {
    logger.error("reportPlayer error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/user/players/:id/block
 * Idempotent — re-blocking refreshes the reason. Also removes any existing
 * follow relationship in both directions so a blocked user doesn't keep
 * appearing in feeds.
 */
export const blockPlayer = async (req, res) => {
  try {
    const blockerId = req.user?.id ? await resolveUserId(req.user.id) : null;
    if (!blockerId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const blockedId = await resolveUserId(req.params.id);
    if (!blockedId) return res.status(404).json({ success: false, message: "User not found" });
    if (blockedId === blockerId) {
      return res.status(400).json({ success: false, message: "You cannot block yourself" });
    }

    const reason = req.body?.reason ? String(req.body.reason).slice(0, 500) : null;

    await prisma.$transaction(async (tx) => {
      await tx.blockedUser.upsert({
        where: { blockerId_blockedId: { blockerId, blockedId } },
        update: { reason },
        create: { blockerId, blockedId, reason },
      });
      // Best-effort: tear down follow edges either way.
      await tx.userRelationship.deleteMany({
        where: {
          OR: [
            { userId: blockerId, targetId: blockedId },
            { userId: blockedId, targetId: blockerId },
          ],
        },
      });
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error("blockPlayer error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/user/players/:id/block
 * Lifts the block. The reverse-direction block (target blocking blocker)
 * is left intact.
 */
export const unblockPlayer = async (req, res) => {
  try {
    const blockerId = req.user?.id ? await resolveUserId(req.user.id) : null;
    if (!blockerId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const blockedId = await resolveUserId(req.params.id);
    if (!blockedId) return res.status(404).json({ success: false, message: "User not found" });

    await prisma.blockedUser.deleteMany({
      where: { blockerId, blockedId },
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error("unblockPlayer error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// Phase 7 — Mutuals + profile QR
// ════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/user/players/:id/mutual?limit=
 * Users that BOTH the viewer and the target follow.
 *
 * "Mutual" here is mutual-followed (people in common downstream of both),
 * not reciprocal-follow between viewer and target. The reciprocal flag for
 * the latter is exposed elsewhere (isFollowing / isFollowedBy on profile).
 */
export const getMutualConnections = async (req, res) => {
  try {
    const viewerId = req.user?.id ? await resolveUserId(req.user.id) : null;
    if (!viewerId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const targetId = await resolveUserId(req.params.id);
    if (!targetId) return res.status(404).json({ success: false, message: "User not found" });
    if (targetId === viewerId) {
      return res.status(200).json({ success: true, mutuals: [], count: 0 });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    // One round-trip: intersect targetIds the viewer follows with targetIds
    // the target follows. Take the user metadata in the same join.
    const rows = await prisma.userRelationship.findMany({
      where: {
        userId: viewerId,
        target: {
          followers: { some: { userId: targetId } },
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        target: {
          select: {
            id: true, name: true, username: true, profilePicture: true,
            city: true, state: true,
          },
        },
      },
    });

    const mutuals = rows.map((r) => r.target).filter(Boolean);
    return res.status(200).json({ success: true, mutuals, count: mutuals.length });
  } catch (err) {
    logger.error("getMutualConnections error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/user/players/me/qr
 * Returns a PNG QR code for the caller's profile deep link.
 *
 * Deep-link format mirrors what the Flutter app already handles:
 *   kridaz://player/<userId>
 * Query ?format=svg returns vector for high-DPI print scenarios.
 */
export const getMyProfileQr = async (req, res) => {
  try {
    const meId = req.user?.id ? await resolveUserId(req.user.id) : null;
    if (!meId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const me = await prisma.user.findUnique({
      where: { id: meId },
      select: { id: true, username: true },
    });
    if (!me) return res.status(404).json({ success: false, message: "User not found" });

    const handle = me.username || me.id;
    const deepLink = `kridaz://player/${handle}`;
    const QRCode = (await import('qrcode')).default;

    const format = String(req.query.format || 'png').toLowerCase();
    if (format === 'svg') {
      const svg = await QRCode.toString(deepLink, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'private, max-age=600');
      return res.status(200).send(svg);
    }

    const buf = await QRCode.toBuffer(deepLink, { type: 'png', margin: 1, errorCorrectionLevel: 'M', width: 512 });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=600');
    return res.status(200).send(buf);
  } catch (err) {
    logger.error("getMyProfileQr error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
