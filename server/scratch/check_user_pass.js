import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Owner from '../models/owner.model.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkUser() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: 'saaviksolutions@gmail.com' });
  const owner = await Owner.findOne({ email: 'saaviksolutions@gmail.com' });
  
  console.log('User:', user ? { id: user._id, hasPassword: !!user.password, passwordLength: user.password?.length } : 'Not found');
  console.log('Owner:', owner ? { id: owner._id, hasPassword: !!owner.password, passwordLength: owner.password?.length } : 'Not found');
  
  process.exit();
}

checkUser();
