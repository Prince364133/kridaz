
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import CommunityPost from '../models/communityPost.model.js';
import User from '../models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fix() {
  try {
    const uri = process.env.MONGO_URI;
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const posts = await CommunityPost.find();
    console.log(`Total posts: ${posts.length}`);

    let fixedCount = 0;
    for (const post of posts) {
      // Check if adminId belongs to a User
      const user = await User.findById(post.adminId);
      if (user && post.authorModel !== 'User') {
        post.authorModel = 'User';
        await post.save();
        fixedCount++;
      }
    }

    console.log(`Fixed ${fixedCount} posts to use User authorModel`);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

fix();
