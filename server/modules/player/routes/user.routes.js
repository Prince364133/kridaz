import express from 'express';
import {
  searchPlayers,
  followPlayer,
  unfollowPlayer,
  getNetwork,
  getPlayerProfile,
  getNetworkById,
  getNearbyPlayers,
  updateUserLocation,
  updateNotificationPreferences,
  getPlayerRecommendations,
  getPlayerStats,
  getPlayerMatches,
  getPlayerActivity,
  submitMatchReviews,
  getPlayerReviews,
  getPlayerAchievements,
  getLeaderboard,
  updateCoverImage,
  uploadPlayerMedia,
  getPlayerMedia,
  updatePlayerMedia,
  deletePlayerMedia,
  discoverPlayers,
  recordProfileView,
  getMyViewers,
  reportPlayer,
  blockPlayer,
  unblockPlayer,
  getMutualConnections,
  getMyProfileQr
} from '../player.controller.js';
import userAuth from "../../../middleware/jwt/user.middleware.js";
import upload from "../../../middleware/uploads/upload.middleware.js";
import blockCheck from "../../../middleware/block.middleware.js";
import {
  reviewLimiter,
  reportLimiter,
  blockLimiter,
  followLimiter,
  profileViewLimiter,
} from "../../../middleware/rateLimiter.middleware.js";


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Player
 *   description: Player discovery and social networking
 */

// ── Public Routes ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /player/search:
 *   get:
 *     summary: Search for players
 *     tags: [Player]
 */
router.get('/search', searchPlayers);

// ── Authenticated Routes (Static) ───────────────────────────────────────────

import { optionalUserAuth } from "../../../middleware/jwt/user.middleware.js";

/**
 * @swagger
 * /player/nearby:
 *   get:
 *     summary: Get nearby players
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.get('/nearby', optionalUserAuth, getNearbyPlayers);

/**
 * @swagger
 * /player/recommendations:
 *   get:
 *     summary: Get personalized follow recommendations for the current player
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.get('/recommendations', userAuth, getPlayerRecommendations);

/**
 * @swagger
 * /player/location:
 *   post:
 *     summary: Update user location (GPS)
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.post('/location', userAuth, updateUserLocation);

/**
 * @swagger
 * /player/notification-preferences:
 *   patch:
 *     summary: Update notification preferences
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.patch('/notification-preferences', userAuth, updateNotificationPreferences);

/**
 * @swagger
 * /player/network:
 *   get:
 *     summary: Get my followers/following
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.get('/network', userAuth, getNetwork);

/**
 * @swagger
 * /player/leaderboard:
 *   get:
 *     summary: Per-sport per-city leaderboard
 *     tags: [Player]
 */
router.get('/leaderboard', getLeaderboard);

// ── Phase 6: discovery / viewers ────────────────────────────────────────────
/**
 * @swagger
 * /player/discover:
 *   get:
 *     summary: Discover players (sport, city, skill, rating filters)
 *     tags: [Player]
 */
router.get('/discover', discoverPlayers);

/**
 * @swagger
 * /player/me/viewers:
 *   get:
 *     summary: Recent unique viewers of my profile
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.get('/me/viewers', userAuth, getMyViewers);

/**
 * @swagger
 * /player/me/qr:
 *   get:
 *     summary: QR code (PNG; ?format=svg) for my profile deep link
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.get('/me/qr', userAuth, getMyProfileQr);

// ── Phase 5: media / cover ───────────────────────────────────────────────────
// All literal-path routes; safe to register before /:id.
/**
 * @swagger
 * /player/me/cover:
 *   post:
 *     summary: Upload cover image
 *     tags: [Player]
 */
router.post('/me/cover', userAuth, upload.single('coverImage'), updateCoverImage);

/**
 * @swagger
 * /player/me/media:
 *   post:
 *     summary: Upload a profile-gallery photo
 *     tags: [Player]
 */
router.post('/me/media', userAuth, upload.single('photo'), uploadPlayerMedia);

/**
 * @swagger
 * /player/me/media/{mediaId}:
 *   patch:
 *     summary: Update caption / tags / pinned (owner only)
 *     tags: [Player]
 */
router.patch('/me/media/:mediaId', userAuth, updatePlayerMedia);

/**
 * @swagger
 * /player/me/media/{mediaId}:
 *   delete:
 *     summary: Delete a profile-gallery item (owner only)
 *     tags: [Player]
 */
router.delete('/me/media/:mediaId', userAuth, deletePlayerMedia);

// ── Public Parameterized / Wildcard Routes ──────────────────────────────────

/**
 * @swagger
 * /player/{id}:
 *   get:
 *     summary: Get player profile
 *     tags: [Player]
 */
router.get('/:id', optionalUserAuth, blockCheck, getPlayerProfile);

/**
 * @swagger
 * /player/{id}/stats:
 *   get:
 *     summary: Per-sport career stats (optionally filtered with ?sport=)
 *     tags: [Player]
 */
router.get('/:id/stats', optionalUserAuth, blockCheck, getPlayerStats);

/**
 * @swagger
 * /player/{id}/matches:
 *   get:
 *     summary: Paginated recent matches (?sport=&cursor=&limit=)
 *     tags: [Player]
 */
router.get('/:id/matches', optionalUserAuth, blockCheck, getPlayerMatches);

/**
 * @swagger
 * /player/{id}/activity:
 *   get:
 *     summary: Activity heatmap (?window=30d|90d|365d)
 *     tags: [Player]
 */
router.get('/:id/activity', optionalUserAuth, blockCheck, getPlayerActivity);

/**
 * @swagger
 * /player/{id}/achievements:
 *   get:
 *     summary: Achievements earned (trophies + badges)
 *     tags: [Player]
 */
router.get('/:id/achievements', optionalUserAuth, blockCheck, getPlayerAchievements);

/**
 * @swagger
 * /player/{id}/reviews:
 *   get:
 *     summary: Peer reviews received + aggregate roll-up (paginated)
 *     tags: [Player]
 */
router.get('/:id/reviews', optionalUserAuth, blockCheck, getPlayerReviews);

/**
 * @swagger
 * /player/{id}/media:
 *   get:
 *     summary: Profile gallery (?type=photo|reel)
 *     tags: [Player]
 */
router.get('/:id/media', optionalUserAuth, blockCheck, getPlayerMedia);

/**
 * @swagger
 * /player/match/{matchId}/review:
 *   post:
 *     summary: Submit bulk peer reviews after a match
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.post('/match/:matchId/review', userAuth, reviewLimiter, submitMatchReviews);

// ── Authenticated Parameterized / Wildcard Routes ───────────────────────────

/**
 * @swagger
 * /player/{id}/follow:
 *   post:
 *     summary: Follow a player
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.post('/:id/follow', userAuth, followLimiter, blockCheck, followPlayer);

/**
 * @swagger
 * /player/{id}/unfollow:
 *   post:
 *     summary: Unfollow a player
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.post('/:id/unfollow', userAuth, followLimiter, unfollowPlayer);

/**
 * @swagger
 * /player/{id}/network:
 *   get:
 *     summary: Get another player's network
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.get('/:id/network', userAuth, blockCheck, getNetworkById);

/**
 * @swagger
 * /player/{id}/mutual:
 *   get:
 *     summary: Users that both the viewer and the target follow
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.get('/:id/mutual', userAuth, blockCheck, getMutualConnections);

/**
 * @swagger
 * /player/{id}/view:
 *   post:
 *     summary: Record a profile view (deduped per UTC day)
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.post('/:id/view', userAuth, profileViewLimiter, blockCheck, recordProfileView);

/**
 * @swagger
 * /player/{id}/report:
 *   post:
 *     summary: Report a player to moderation
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.post('/:id/report', userAuth, reportLimiter, reportPlayer);

/**
 * @swagger
 * /player/{id}/block:
 *   post:
 *     summary: Block a player
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.post('/:id/block', userAuth, blockLimiter, blockPlayer);

/**
 * @swagger
 * /player/{id}/block:
 *   delete:
 *     summary: Unblock a player
 *     tags: [Player]
 *     security:
 *       - BearerAuth: []
 */
router.delete('/:id/block', userAuth, blockLimiter, unblockPlayer);

export default router;
