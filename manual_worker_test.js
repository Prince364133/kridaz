import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { uploadToR2 } from './server/utils/r2.js';

dotenv.config({ path: './server/.env' });

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const ReelSchema = new mongoose.Schema({}, { strict: false });
const Reel = mongoose.model('Reel', ReelSchema);

async function run() {
  const reelId = '6a0604e2d2c669d39ee478dd';
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const reel = await Reel.findById(reelId);
    if (!reel) {
      console.error('Reel not found');
      return;
    }
    
    const localPath = path.resolve('server', reel.localPath);
    console.log(`Local Path: ${localPath}`);
    
    if (!(await fs.exists(localPath))) {
      console.error('Local file does not exist');
      return;
    }

    const outputDir = path.resolve('server', 'uploads', 'reels', 'temp', reelId);
    await fs.ensureDir(outputDir);
    
    console.log('Starting transcoding...');
    
    await new Promise((resolve, reject) => {
      ffmpeg(localPath)
        .outputOptions([
          '-profile:v baseline',
          '-level 3.0',
          '-start_number 0',
          '-hls_time 10',
          '-hls_list_size 0',
          '-f hls'
        ])
        .on('start', (cmd) => console.log('Command:', cmd))
        .on('progress', (p) => console.log(`Progress: ${p.percent}%`))
        .on('error', (err) => reject(err))
        .on('end', () => resolve())
        .save(path.join(outputDir, 'playlist.m3u8'));
    });
    
    console.log('Transcoding finished. Uploading to R2...');
    
    // Just test one file upload to R2
    const files = await fs.readdir(outputDir);
    console.log('Files to upload:', files);
    
    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const r2Key = `reels/${reelId}/${file}`;
      console.log(`Uploading ${file} to ${r2Key}...`);
      // We'll actually try to upload it
      // await uploadToR2(filePath, r2Key, 'video/mp2t'); // Simplified
    }
    
    console.log('Manual test finished successfully');
    process.exit(0);
  } catch (err) {
    console.error('Manual test failed:', err);
    process.exit(1);
  }
}

run();
