import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function checkUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const invalidUsers = await User.find({
      'locationData.coordinates': { $exists: true, $not: { $type: 'array' } }
    });

    console.log(`Found ${invalidUsers.length} users with invalid coordinates`);
    if (invalidUsers.length > 0) {
      console.log('IDs:', invalidUsers.map(u => u._id));
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUsers();
