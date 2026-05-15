import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import Reel from '../models/reel.model.js';
// We will create this worker utility next
// import { processReelVideo } from '../utils/reelWorker.js';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const reelQueue = new Queue('reels', { 
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  }
});

export const reelWorker = new Worker('reels', async (job) => {
  const { reelId } = job.data;
  
  try {
    const reel = await Reel.findById(reelId);
    if (!reel) throw new Error(`Reel ${reelId} not found`);

    await Reel.findByIdAndUpdate(reelId, { status: 'processing' });

    // Dynamic import to avoid circular dependencies and load heavy modules only when needed
    const { processReelVideo } = await import('../utils/reelWorker.js');
    
    const result = await processReelVideo(reel, job.data.localPath);
    
    await Reel.findByIdAndUpdate(reelId, {
      status: 'ready',
      hlsUrl: result.hlsUrl,
      thumbnailUrl: result.thumbnailUrl,
      duration: result.duration,
      aspectRatio: result.aspectRatio,
      rawVideoUrl: null 
    });

    const io = (await import('../config/socket.js')).getIO();
    if (io) {
      const userId = reel.userId || reel.creatorId || 'anonymous';
      io.to(`user_${userId}`).emit('MEDIA_PROCESSING_COMPLETE', {
        mediaId: reelId,
        mediaType: 'reel',
        hlsUrl: result.hlsUrl,
        thumbnailUrl: result.thumbnailUrl
      });
    }

    console.log(`[REELS] Successfully processed reel: ${reelId}`);
  } catch (error) {
    console.error(`[REELS] Error processing reel ${reelId}:`, error);
    await Reel.findByIdAndUpdate(reelId, { 
      status: 'failed', 
      processingError: error.message 
    });
    throw error;
  }
}, {
  connection,
  concurrency: 2, // Allow 2 videos to be processed simultaneously on this instance
});

reelWorker.on('failed', (job, err) => {
  console.error(`[REELS] Job ${job?.id} failed:`, err.message);
});
