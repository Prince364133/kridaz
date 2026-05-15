import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Reel from '../models/reel.model.js';
import User from '../models/user.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function auditReels() {
  try {
    console.log('🚀 Starting Reels Audit...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const totalReels = await Reel.countDocuments();
    const readyReels = await Reel.countDocuments({ status: 'ready' });
    const pendingReels = await Reel.countDocuments({ status: 'pending' });
    const failedReels = await Reel.countDocuments({ status: 'failed' });

    console.log(`\n📊 Stats:`);
    console.log(`- Total Reels: ${totalReels}`);
    console.log(`- Ready: ${readyReels}`);
    console.log(`- Pending: ${pendingReels}`);
    console.log(`- Failed: ${failedReels}`);

    if (failedReels > 0) {
      const failures = await Reel.find({ status: 'failed' }).limit(5);
      console.log(`\n❌ Recent Failures:`);
      failures.forEach(f => console.log(`  - ID: ${f._id}, Error: ${f.error || 'Unknown'}`));
    }

    console.log(`\n🔍 Checking for broken links...`);
    const sampleReels = await Reel.find({ status: 'ready' }).limit(10);
    for (const reel of sampleReels) {
      const creator = await User.findById(reel.creatorId);
      if (!creator) {
        console.warn(`  ⚠️ Reel ${reel._id} has no creator!`);
      }
      
      if (!reel.hlsUrl) {
        console.warn(`  ⚠️ Reel ${reel._id} is 'ready' but has no hlsUrl!`);
      }
    }

    console.log(`\n✅ Audit Complete.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Audit Failed:', err);
    process.exit(1);
  }
}

auditReels();
