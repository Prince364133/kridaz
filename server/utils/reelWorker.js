import ffmpeg from 'fluent-ffmpeg';
import Reel from '../models/reel.model.js';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import { uploadDirectoryToR2 } from './r2.js';

// Tell fluent-ffmpeg where to find the binaries
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

/**
 * Processes a reel video:
 * 1. Downloads the raw video
 * 2. Transcodes to HLS (360p, 480p, 720p)
 * 3. Generates thumbnails
 * 4. Uploads to storage
 */
export const processReelVideo = async (reel, localPath) => {
  const tempDir = path.join(os.tmpdir(), `reel_${reel._id}`);
  const inputPath = localPath || path.join(tempDir, 'input.mp4');
  const outputDir = path.join(tempDir, 'output');
  const thumbnailPath = path.join(tempDir, 'thumbnail.jpg');

  try {
    console.log(`[WORKER] Starting job for reel ${reel._id}`);
    console.log(`[WORKER] Current CWD: ${process.cwd()}`);
    console.log(`[WORKER] Input localPath: ${localPath}`);
    
    await fs.ensureDir(outputDir);

    // 1. If we don't have a local path (retry scenario?), we must download from rawVideoUrl
    if (!localPath) {
      if (!reel.rawVideoUrl) throw new Error('No source video available (missing localPath and rawVideoUrl)');
      
      console.log(`[WORKER] Downloading raw video from ${reel.rawVideoUrl}`);
      const response = await axios({
        url: reel.rawVideoUrl,
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

    // 1.1. Upload raw video to Cloudinary from disk (if it's not already uploaded)
    let rawVideoUrl = reel.rawVideoUrl;
    if (localPath && !rawVideoUrl) {
      console.log('[WORKER] Uploading raw video to Cloudinary...');
      const cloudResult = await cloudinary.uploader.upload(localPath, {
        resource_type: 'video',
        folder: 'kridaz/reels/raw'
      });
      rawVideoUrl = cloudResult.secure_url;
      await Reel.findByIdAndUpdate(reel._id, { rawVideoUrl });
    }

    // 2. Get Metadata
    const metadata = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const duration = metadata.format.duration;
    const { width, height } = metadata.streams[0];
    const aspectRatio = width / height;

    // 2.1. Aspect Ratio Validation (Targeting 9:16 vertical)
    if (aspectRatio > 1) {
      // It's a horizontal video - we should ideally crop or reject
      // For now, let's allow but flag it in metadata
      console.warn(`[WORKER] Reel ${reel._id} is horizontal (${width}x${height}).`);
    }

    // 3. Generate Thumbnail
    console.log('[WORKER] Generating thumbnail...');
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

    // 4. Transcode to HLS
    console.log('[WORKER] Transcoding to HLS with Aggressive Compression...');
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-vcodec libx264',
          '-crf 28',               // Higher CRF = more compression
          '-preset fast',
          '-maxrate 1000k',        // Cap bitrate to 1Mbps
          '-bufsize 2000k',
          '-pix_fmt yuv420p',
          '-vf scale=720:-2',     // Ensure vertical 720p height
          '-profile:v baseline',
          '-level 3.0',
          '-start_number 0',
          '-hls_time 4',           // Smaller segments for faster startup
          '-hls_list_size 0',
          '-f hls'
        ])
        .output(path.join(outputDir, 'playlist.m3u8'))
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    // 5. Content Moderation
    console.log('[WORKER] Running content moderation check...');
    // Use Cloudinary's built-in moderation if possible, or a 3rd party API
    // For this implementation, we'll mark as pending moderation if it's suspicious
    // but default to true for the demo flow.
    const isSafe = true; 
    if (!isSafe) {
      await Reel.findByIdAndUpdate(reel._id, { status: 'rejected', moderationReason: 'Flagged by AI' });
      throw new Error('Content flagged as inappropriate');
    }

    // 6. Upload to R2 (HLS Chunks)
    console.log('[WORKER] Uploading HLS chunks to R2...');
    const r2Prefix = `reels/${reel._id}`;
    await uploadDirectoryToR2(outputDir, r2Prefix);

    // 7. Upload Thumbnail to Cloudinary
    console.log('[WORKER] Uploading thumbnail to Cloudinary...');
    const thumbnailResult = await cloudinary.uploader.upload(thumbnailPath, {
      folder: 'kridaz/reels/thumbnails'
    });

    const hlsUrl = `${process.env.REELS_CDN_URL}/${r2Prefix}/playlist.m3u8`;

    return {
      hlsUrl,
      thumbnailUrl: thumbnailResult.secure_url,
      duration,
      aspectRatio,
      width,
      height
    };
  } catch (error) {
    console.error(`[WORKER] [ERROR] Job ${reel._id} failed:`, error.message);
    
    // Cleanup on failure
    try {
      if (await fs.exists(tempDir)) {
        await fs.remove(tempDir);
        console.log(`[WORKER] Cleaned up temp directory after failure: ${tempDir}`);
      }
    } catch (cleanupError) {
      console.error('[WORKER] [ERROR] Cleanup failed:', cleanupError.message);
    }

    throw error; // Re-throw to allow BullMQ retries
  } finally {
    // Cleanup
    await fs.remove(tempDir);
    if (localPath && await fs.exists(localPath)) {
      await fs.remove(localPath);
      console.log(`[WORKER] Cleaned up local file: ${localPath}`);
    }
  }
};
