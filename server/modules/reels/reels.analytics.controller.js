import Reel from '../../models/reel.model.js';
import ReelInteraction from '../../models/reelInteraction.model.js';

/**
 * Tracks watch time and completion
 */
export const trackWatchTime = async (req, res) => {
  const { id } = req.params;
  const { watchTime, completed } = req.body;
  const userId = req.user?.id;

  try {
    const reel = await Reel.findById(id);
    if (!reel) return res.status(404).json({ success: false, message: 'Reel not found' });

    // Update aggregate stats on the reel
    // In a massive scale app, we would use Redis INCR and sync periodically
    // For now, we'll do atomic Mongoose updates
    const updateData = {
      $inc: { totalWatchTime: watchTime }
    };

    if (completed) {
      updateData.$inc.completionCount = 1;
    }

    await Reel.findByIdAndUpdate(id, updateData);

    // Track for user history if logged in
    if (userId) {
      await ReelInteraction.findOneAndUpdate(
        { userId, reelId: id },
        { 
          $set: { lastWatchTime: watchTime },
          $inc: { totalWatches: 1 }
        },
        { upsert: true }
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Recommendations (Phase 1: Weighted Score)
 */
export const getRecommendedReels = async (req, res) => {
  const { cursor } = req.query;
  const limit = 5;

  try {
    const query = { status: 'ready' };
    if (cursor) {
      query._id = { $lt: cursor };
    }

    // Recommendation logic (Phase 1):
    // We fetch a batch and sort by a calculated popularity score
    // Score = (Likes * 2) + (Views * 1) + (CompletionRate * 5)
    // To do this efficiently at scale, we use an aggregation pipeline or a pre-calculated 'popularityScore' field
    
    const reels = await Reel.aggregate([
      { $match: query },
      { 
        $addFields: {
          popularityScore: {
            $add: [
              { $multiply: ['$stats.likes', 2] },
              { $multiply: ['$stats.views', 1] },
              { $multiply: [{ $divide: ['$completionCount', { $max: ['$stats.views', 1] }] }, 100] }
            ]
          }
        }
      },
      { $sort: { popularityScore: -1, _id: -1 } },
      { $limit: limit }
    ]);

    const nextCursor = reels.length === limit ? reels[reels.length - 1]._id : null;

    res.json({
      success: true,
      data: reels,
      nextCursor
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
