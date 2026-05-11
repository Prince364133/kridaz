import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import Owner from '../models/owner.model.js';

dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB'); 

    const admins = await User.find({ role: { $in: ['admin', 'BMSP_ADMIN', 'SUPER_ADMIN'] } });
    console.log('Admin Users:', admins.map(u => ({ email: u.email, role: u.role })));

    const owners = await Owner.find({ role: { $in: ['admin', 'BMSP_ADMIN', 'SUPER_ADMIN'] } });
    console.log('Admin Owners:', owners.map(o => ({ email: o.email, role: o.role })));

    const testUser = await User.findOne({ email: 'testuser@gmail.com' });
    if (!testUser) {
      console.log('Creating testuser@gmail.com...');
      // Note: You might need to hash password if checking login
    } else {
      console.log('Test user exists:', testUser.email);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
