import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import Reel from '../models/reel.model.js';
import Story from '../models/story.model.js';
import CommunityPost from '../models/communityPost.model.js';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const MODELS = {
  reel: Reel,
  story: Story,
  community: CommunityPost
};

export const mediaQueue = new Queue('media_processing', { 
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
  }
});

export const mediaWorker = new Worker('media_processing', async (job) => {
  const { mediaId, mediaType, localPath } = job.data;
  const Model = MODELS[mediaType];
  
  if (!Model) throw new Error(`Invalid media type: ${mediaType}`);

  try {
    const media = await Model.findById(mediaId);
    if (!media) throw new Error(`${mediaType} ${mediaId} not found`);

    await Model.findByIdAndUpdate(mediaId, { status: 'processing' });

    const { processMediaVideo } = await import('../utils/reelWorker.js');
    const result = await processMediaVideo(media, mediaType, localPath);
    
    const updateData = {
      status: 'ready',
      hlsUrl: result.hlsUrl,
      thumbnailUrl: result.thumbnailUrl,
      duration: result.duration,
      aspectRatio: result.aspectRatio,
    };

    // Specific field mappings
    if (mediaType === 'reel') {
      updateData.rawVideoUrl = null;
    } else if (mediaType === 'story' || mediaType === 'community') {
      updateData.rawMediaUrl = null;
      updateData.mediaUrl = result.hlsUrl;
    }

    await Model.findByIdAndUpdate(mediaId, updateData);

    const io = (await import('../config/socket.js')).getIO();
    if (io) {
      const userId = media.userId || media.creatorId || media.adminId || 'anonymous';
      io.to(`user_${userId}`).emit('MEDIA_PROCESSING_COMPLETE', {
        mediaId,
        mediaType,
        hlsUrl: result.hlsUrl,
        thumbnailUrl: result.thumbnailUrl
      });
    }

    console.log(`[MEDIA_WORKER] Successfully processed ${mediaType}: ${mediaId}`);
  } catch (error) {
    console.error(`[MEDIA_WORKER] Error processing ${mediaType} ${mediaId}:`, error);
    await Model.findByIdAndUpdate(mediaId, { 
      status: 'failed', 
      processingError: error.message 
    });
    throw error;
  }
}, {
  connection,
  concurrency: 2,
});
