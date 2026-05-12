
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Story from '../models/story.model.js';
import User from '../models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fix() {
  try {
    const uri = process.env.MONGO_URI;
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const stories = await Story.find();
    console.log(`Total stories: ${stories.length}`);

    let fixedCount = 0;
    for (const story of stories) {
      // Check if userId belongs to a User
      const user = await User.findById(story.userId);
      if (user && story.userModel !== 'User') {
        story.userModel = 'User';
        await story.save();
        fixedCount++;
      }
    }

    console.log(`Fixed ${fixedCount} stories to use User userModel`);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

fix();
