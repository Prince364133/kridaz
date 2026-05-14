const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'server/.env') });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://mongo:xveRVKGznAVohEinniCUTWJUXTiPdURD@junction.proxy.rlwy.net:15699";

async function cleanup() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Create model on the fly
    const ReelSchema = new mongoose.Schema({}, { strict: false });
    const Reel = mongoose.model('Reel', ReelSchema);
    
    // Find reels with placeholder thumbnails
    const result = await Reel.updateMany(
      { thumbnailUrl: /via\.placeholder\.com/ },
      { $set: { thumbnailUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1000&auto=format&fit=crop' } }
    );

    console.log(`Updated ${result.modifiedCount} reels with valid thumbnails.`);

    // Check for broken creators too
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const userResult = await User.updateMany(
      { profilePicture: /via\.placeholder\.com/ },
      { $set: { profilePicture: 'https://avatar.vercel.sh/kridaz' } }
    );
    console.log(`Updated ${userResult.modifiedCount} users with valid profile pictures.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
  }
}

cleanup();
