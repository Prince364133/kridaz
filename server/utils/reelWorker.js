import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import axios from 'axios';
import { uploadDirectoryToR2, uploadToR2, deleteFromR2 } from './r2.js';
import { getEmitter } from '../config/socketEmitter.js';
import logger from './logger.js';

// Tell fluent-ffmpeg where to find the binaries
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

/**
 * Adaptive Bitrate Transcoding Settings
 */
const RENDITIONS = [
  {
    resolution: '360p',
    width: 360,
    height: 640,
    bitrate: '800k',
    bufsize: '1200k',
    maxrate: '850k',
  },
  {
    resolution: '480p',
    width: 480,
    height: 854,
    bitrate: '1400k',
    bufsize: '2100k',
    maxrate: '1500k',
  },
  {
    resolution: '720p',
    width: 720,
    height: 1280,
    bitrate: '2800k',
    bufsize: '4200k',
    maxrate: '3000k',
  },
];

/**
 * Processes a video with Adaptive Bitrate (ABR) HLS
 */
export const processMediaVideo = async (media, mediaType, localPath = null) => {
  const tempId = `media_${media.id}_${Date.now()}`;
  const tempDir = path.join(os.tmpdir(), tempId);
  const inputPath = localPath || path.join(tempDir, 'input.mp4');
  const outputDir = path.join(tempDir, 'output');
  const thumbnailPath = path.join(tempDir, 'thumbnail.jpg');

  try {
    logger.info(`[WORKER] [${media.id}] Starting Adaptive Bitrate pipeline for ${mediaType}...`);
    await fs.ensureDir(outputDir);

    const sourceUrl = media.rawVideoUrl || media.rawMediaUrl;

    // 1. Download if no local path (Direct-to-cloud flow)
    if (!localPath) {
      if (!sourceUrl) throw new Error('No source video available');
      logger.info(`[WORKER] [${media.id}] Downloading raw video from R2...`);
      const response = await axios({
        url: sourceUrl,
        method: 'GET',
        responseType: 'stream'
      });
      const writer = fs.createWriteStream(inputPath);
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    }

    // 2. Probing & Metadata
    const metadata = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const duration = metadata.format.duration;
    const videoStream = metadata.streams.find(s => s.codec_type === 'video');
    const { width, height } = videoStream || metadata.streams[0];
    const aspectRatio = width / height;

    // 3. Generate Thumbnail
    logger.info(`[WORKER] [${media.id}] Generating optimized thumbnail...`);
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: ['1'],
          filename: 'thumbnail.jpg',
          folder: tempDir,
          size: '720x?'
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // 4. Multi-Variant Transcoding
    logger.info(`[WORKER] [${media.id}] Transcoding ABR Ladder (360p, 480p, 720p)...`);
    const emitter = getEmitter();
    const userId = media.userId || media.creatorId || media.adminId || 'anonymous';
    const userRoom = `user_${userId}`;
    
    // Prefix mapping: reels -> reels/, stories -> stories/, community -> community/
    const modelPrefix = mediaType === 'community' ? 'community' : (mediaType === 'story' ? 'stories' : 'reels');

    // Create master playlist content
    let masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:3\n';

    for (let i = 0; i < RENDITIONS.length; i++) {
      const rendition = RENDITIONS[i];
      const renditionDir = path.join(outputDir, rendition.resolution);
      await fs.ensureDir(renditionDir);

      logger.info(`[WORKER] [${media.id}] Encoding ${rendition.resolution}...`);
      
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions([
            '-vcodec libx264',
            '-crf 26',
            '-preset veryfast',
            `-b:v ${rendition.bitrate}`,
            `-maxrate ${rendition.maxrate}`,
            `-bufsize ${rendition.bufsize}`,
            '-pix_fmt yuv420p',
            `-vf scale=w=${rendition.width}:h=-2`,
            '-profile:v main',
            '-level 3.1',
            '-start_number 0',
            '-hls_time 4',               
            '-hls_list_size 0',
            '-hls_segment_type mpegts',
            '-hls_segment_filename', path.join(renditionDir, 'segment_%03d.ts'),
            '-f hls'
          ])
          .output(path.join(renditionDir, 'playlist.m3u8'))
          .on('progress', (progress) => {
            const renditionProgress = Math.min(Math.max(progress.percent || 0, 0), 100);
            const totalProgress = Math.round(((i / RENDITIONS.length) * 100) + (renditionProgress / RENDITIONS.length));
            
            if (emitter) {
              emitter.to(userRoom).emit('MEDIA_PROCESSING_PROGRESS', {
                mediaId: media.id,
                mediaType: mediaType,
                progress: totalProgress,
                status: `Optimizing ${rendition.resolution}...`
              });
            }
          })
          .on('end', resolve)
          .on('error', reject)
          .run();
      });

      const bandwidth = parseInt(rendition.bitrate) * 1000;
      masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${rendition.width}x${rendition.height}\n${rendition.resolution}/playlist.m3u8\n`;
    }

    await fs.writeFile(path.join(outputDir, 'master.m3u8'), masterPlaylist);

    // 5. Upload Everything to R2
    logger.info(`[WORKER] [${media.id}] Uploading HLS variants and Master Manifest...`);
    const r2Prefix = `${modelPrefix}/${media.id}`;
    await uploadDirectoryToR2(outputDir, r2Prefix);

    // 6. Upload Thumbnail
    const thumbKey = `thumbnails/${media.id}.jpg`;
    const thumbUploadResult = await uploadToR2(thumbnailPath, thumbKey, 'image/jpeg');

    const hlsUrl = `${process.env.REELS_CDN_URL}/${r2Prefix}/master.m3u8`;

    // 7. Cleanup Raw Original from R2 (if it was a temp upload)
    if (sourceUrl && sourceUrl.includes('/temp/')) {
      const urlParts = sourceUrl.split('/');
      const tempKey = urlParts.slice(urlParts.indexOf('temp')).join('/');
      logger.info(`[WORKER] [${media.id}] Deleting temporary raw file: ${tempKey}`);
      await deleteFromR2(tempKey).catch(err => logger.warn(`[WORKER] Cleanup warning: ${err.message}`));
    }

    return {
      hlsUrl,
      thumbnailUrl: thumbUploadResult.url,
      duration,
      aspectRatio,
      width,
      height
    };

  } catch (error) {
    logger.error(`[WORKER] [${media.id}] [ERROR]:`, error);
    throw error;
  } finally {
    await fs.remove(tempDir).catch(() => {});
    if (localPath) await fs.remove(localPath).catch(() => {});
  }
};
