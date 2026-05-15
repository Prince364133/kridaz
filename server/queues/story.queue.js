import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import Story from '../models/story.model.js';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const storyQueue = new Queue('stories', { 
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
  }
});

export const storyWorker = new Worker('stories', async (job) => {
  const { storyId } = job.data;
  
  try {
    const story = await Story.findById(storyId);
    if (!story) return;

    // Use the same robust video pipeline
    const { processMediaVideo } = await import('../utils/reelWorker.js');
    
    // We pass the story object as a "reel-like" object
    const result = await processMediaVideo(story, 'story');
    
    await Story.findByIdAndUpdate(storyId, {
      status: 'ready',
      hlsUrl: result.hlsUrl,
      mediaUrl: result.hlsUrl, 
      thumbnailUrl: result.thumbnailUrl,
      rawMediaUrl: null 
    });

    const io = (await import('../config/socket.js')).getIO();
    if (io) {
      io.to(`user_${story.userId}`).emit('MEDIA_PROCESSING_COMPLETE', {
        mediaId: storyId,
        mediaType: 'story',
        hlsUrl: result.hlsUrl,
        thumbnailUrl: result.thumbnailUrl
      });
    }

  } catch (error) {
    console.error(`[STORY_WORKER] Error:`, error);
    await Story.findByIdAndUpdate(storyId, { status: 'failed' });
    throw error;
  }
}, { connection, concurrency: 2 });
