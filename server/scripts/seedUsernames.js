import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

dotenv.config({ path: 'server/.env' });

const seedUsernames = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({ username: { $exists: false } });
    console.log(`Found ${users.length} users without usernames`);

    for (const user of users) {
      let baseUsername = (user.name || 'player').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      let username = baseUsername;
      let counter = 1;

      // Ensure uniqueness
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      await User.findOneAndUpdate({ _id: user._id }, { $set: { username } });
      console.log(`Assigned username @${username} to user ${user.name}`);
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedUsernames();
