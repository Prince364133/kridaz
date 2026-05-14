import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: './server/.env' });

const ReelSchema = new mongoose.Schema({
  status: String,
  error: String,
  rawVideoUrl: String,
  hlsUrl: String,
  thumbnailUrl: String,
  createdAt: Date
}, { strict: false });

const Reel = mongoose.model('Reel', ReelSchema);

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    const reels = await Reel.find().sort({ createdAt: -1 }).limit(10);
    
    console.log('Recent Reels:');
    reels.forEach(r => {
      console.log(`ID: ${r._id}, Status: ${r.status}, Error: ${r.error || 'None'}`);
      if (r.error) {
         console.log(`   Full Error: ${r.error}`);
      }
      console.log(`   Created: ${r.createdAt}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
