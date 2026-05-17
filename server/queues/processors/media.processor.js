import { prisma } from "../../config/prisma.js";
import { processMediaVideo } from "../../utils/reelWorker.js";
import { getEmitter } from "../../config/socketEmitter.js";
import * as Sentry from "@sentry/node";
import { initSentry } from "../../config/sentry.js";
import logger from "../../utils/logger.js";

// Initialize Sentry for this worker process
initSentry();

const MODEL_MAP = {
  reel: "reel",
  story: "story",
  community: "post"
};

export default async function mediaProcessor(job) {
  const { mediaId, mediaType, localPath } = job.data;
  const prismaModel = MODEL_MAP[mediaType];
  
  if (!prismaModel) throw new Error(`Invalid media type: ${mediaType}`);
  const Model = prisma[prismaModel];

  try {
    const media = await Model.findUnique({ where: { id: mediaId } });
    if (!media) throw new Error(`${mediaType} ${mediaId} not found`);

    await Model.update({
      where: { id: mediaId },
      data: { status: 'processing' }
    });

    const result = await processMediaVideo(media, mediaType, localPath);
    
    const updateData = {
      status: 'ready',
      hlsUrl: result.hlsUrl,
      thumbnailUrl: result.thumbnailUrl,
      duration: result.duration,
      aspectRatio: result.aspectRatio,
    };

    // Specific field mappings based on model schema
    if (mediaType === 'reel') {
      updateData.rawVideoUrl = null;
    } else if (mediaType === 'story') {
      updateData.rawMediaUrl = null;
      updateData.mediaUrl = result.hlsUrl;
    } else if (mediaType === 'community') {
      // Post model in Prisma might have different fields
      // Assuming it follows the logic where mediaUrls is an array
      updateData.mediaUrls = [result.hlsUrl];
    }

    await Model.update({
      where: { id: mediaId },
      data: updateData
    });

    const emitter = getEmitter();
    if (emitter) {
      const userId = media.userId || media.creatorId || media.authorId || 'anonymous';
      emitter.to(`user_${userId}`).emit('MEDIA_PROCESSING_COMPLETE', {
        mediaId,
        mediaType,
        hlsUrl: result.hlsUrl,
        thumbnailUrl: result.thumbnailUrl
      });
    }

    logger.info(`[MEDIA_PROCESSOR] Successfully processed ${mediaType}: ${mediaId}`);
    return result;
  } catch (error) {
    logger.error(`[MEDIA_PROCESSOR] Error processing ${mediaType} ${mediaId}:`, error);
    Sentry.captureException(error, {
      extra: { mediaId, mediaType }
    });
    
    try {
      await Model.update({
        where: { id: mediaId },
        data: { 
          status: 'failed', 
          // Note: assuming processingError exists in schema, otherwise we skip it
        }
      });
    } catch (updateError) {
      logger.error(`[MEDIA_PROCESSOR] Final status update failed:`, updateError);
    }
    
    throw error;
  }
}

