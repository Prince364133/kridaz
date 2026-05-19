import axios from 'axios';
import { prisma } from '../config/prisma.js';
import { getOrSetCache } from '../utils/cache.js';
import logger from '../utils/logger.js';

const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:8001';

/**
 * Personalised Ground Recommendations service
 * Fetches ranked candidate sets from our Python FastAPI recommender under 200ms SLAs,
 * backed by a 10-minute Redis caching tier and a bulletproof PostgreSQL recovery fallback.
 */
export const getGroundRecommendations = async (userId, lat, lng, limit = 15) => {
  const cacheKey = `rec:grounds:${userId}:${lat || 'none'}:${lng || 'none'}:${limit}`;

  return getOrSetCache(cacheKey, async () => {
    try {
      logger.info(`[RECS] Requesting ground recommendation feed for user ${userId} from ML Service...`);
      
      const response = await axios.get(`${RECOMMENDATION_SERVICE_URL}/api/recommendations/feed`, {
        params: {
          user_id: userId,
          lat: lat ? parseFloat(lat) : undefined,
          lng: lng ? parseFloat(lng) : undefined,
          limit: parseInt(limit),
          include_scores: false
        },
        timeout: 200 // Enforcing strict 200ms SLA
      });

      if (response.data && response.data.success && response.data.data) {
        logger.info(`[RECS] Successfully fetched ${response.data.data.length} ML-ranked grounds.`);
        return response.data.data;
      }
    } catch (err) {
      logger.warn(`[RECS] ML Service unavailable or timed out (SLA 200ms). Falling back to PostgreSQL native queries! Error: ${err.message}`);
    }

    // PostgreSQL-native Fallback (High-Availability Recovery Mode)
    try {
      logger.info(`[RECS] Executing PostgreSQL-native fallback query...`);
      // Fetch approved active turfs sorted by rating and then creation date
      const fallbackGrounds = await prisma.turf.findMany({
        where: {
          isActive: true,
          status: 'approved'
        },
        orderBy: [
          { rating: 'desc' },
          { createdAt: 'desc' }
        ],
        take: parseInt(limit)
      });

      return fallbackGrounds.map(g => ({
        id: g.id,
        name: g.name,
        image: g.image,
        sportTypes: g.sportTypes,
        pricePerHour: parseFloat(g.pricePerHour),
        rating: g.rating ? parseFloat(g.rating) : 3.5,
        latitude: g.latitude ? parseFloat(g.latitude) : null,
        longitude: g.longitude ? parseFloat(g.longitude) : null,
        totalScore: 0.5 // Neutral baseline score for fallback items
      }));
    } catch (fallbackErr) {
      logger.error(`[RECS] PostgreSQL fallback query failed completely!`, fallbackErr);
      return [];
    }
  }, 600); // 10 minutes cache TTL (600 seconds)
};
export default getGroundRecommendations;
