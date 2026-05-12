
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import CommunityPost from '../models/communityPost.model.js';
import User from '../models/user.model.js';
import Owner from '../models/owner.model.js';
import Story from '../models/story.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function check() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.log('MONGO_URI is missing');
        return;
    }
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const users = await User.find({ name: /PRINCE/i });
    console.log('Users found:', users.map(u => ({ id: u._id.toString(), name: u.name, username: u.username })));

    const owners = await Owner.find({ name: /PRINCE/i });
    console.log('Owners found:', owners.map(o => ({ id: o._id.toString(), name: o.name, username: o.username, userId: o.userId?.toString() })));

    for (const user of users) {
      const posts = await CommunityPost.find({ adminId: user._id });
      console.log(`Posts for user ${user.name} (${user._id}):`, posts.length);
      const stories = await Story.find({ userId: user._id });
      console.log(`Stories for user ${user.name} (${user._id}):`, stories.length);
    }

    for (const owner of owners) {
      const posts = await CommunityPost.find({ adminId: owner._id });
      console.log(`Posts for owner ${owner.name} (${owner._id}):`, posts.length);
      const stories = await Story.find({ userId: owner._id });
      console.log(`Stories for owner ${owner.name} (${owner._id}):`, stories.length);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
