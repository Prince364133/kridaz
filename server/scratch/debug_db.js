import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const count = await User.countDocuments();
  console.log('User count:', count);
  const oneUser = await User.findOne();
  console.log('One user:', oneUser);
  process.exit(0);
}

run();
