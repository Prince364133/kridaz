import Reel from '../../models/reel.model.js';
import Story from '../../models/story.model.js';
import CommunityPost from '../../models/communityPost.model.js';
import { processMediaVideo } from '../../utils/reelWorker.js';
import { getIO } from '../../config/socket.js';
import * as Sentry from "@sentry/node";
import { initSentry } from "../../config/sentry.js";

// Initialize Sentry for this worker process
initSentry();

const MODELS = {
  reel: Reel,
  story: Story,
  community: CommunityPost
};

export default async function mediaProcessor(job) {
  const { mediaId, mediaType, localPath } = job.data;
  const Model = MODELS[mediaType];
  
  if (!Model) throw new Error(`Invalid media type: ${mediaType}`);

  try {
    const media = await Model.findById(mediaId);
    if (!media) throw new Error(`${mediaType} ${mediaId} not found`);

    await Model.findByIdAndUpdate(mediaId, { status: 'processing' });

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

    const io = getIO();
    if (io) {
      const userId = media.userId || media.creatorId || media.adminId || 'anonymous';
      io.to(`user_${userId}`).emit('MEDIA_PROCESSING_COMPLETE', {
        mediaId,
        mediaType,
        hlsUrl: result.hlsUrl,
        thumbnailUrl: result.thumbnailUrl
      });
    }

    console.log(`[MEDIA_PROCESSOR] Successfully processed ${mediaType}: ${mediaId}`);
    return result;
  } catch (error) {
    console.error(`[MEDIA_PROCESSOR] Error processing ${mediaType} ${mediaId}:`, error);
    Sentry.captureException(error, {
      extra: { mediaId, mediaType }
    });
    await Model.findByIdAndUpdate(mediaId, { 
      status: 'failed', 
      processingError: error.message 
    });
    throw error;
  }
}
