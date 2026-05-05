import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

dotenv.config();

async function fixUsers() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const users = await User.find({});
  let fixedCount = 0;

  for (const user of users) {
    let needsFix = false;
    
    if (user.locationData && (!user.locationData.coordinates || !Array.isArray(user.locationData.coordinates))) {
      console.log(`Fixing user ${user._id}: invalid locationData`);
      user.locationData = {
        type: 'Point',
        coordinates: [0, 0] // Default coordinates
      };
      needsFix = true;
    }

    if (needsFix) {
      await user.save();
      fixedCount++;
    }
  }

  console.log(`Fixed ${fixedCount} users`);
  process.exit(0);
}

fixUsers();
