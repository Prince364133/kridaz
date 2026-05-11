import mongoose from 'mongoose';
import dotenv from 'dotenv';
import argon2 from 'argon2';
import User from '../models/user.model.js';
import Owner from '../models/owner.model.js';

dotenv.config();

async function setup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const hashedPassword = await argon2.hash('userpassword');
    const adminHashedPassword = await argon2.hash('adminpassword');

    // Update or create admin owner
    await Owner.findOneAndUpdate(
      { email: 'admin@kridaz.com' },
      { 
        $set: { 
          password: adminHashedPassword,
          role: 'admin',
          isVerified: true
        } 
      },
      { upsert: true }
    );
    console.log('Admin owner updated: admin@kridaz.com / adminpassword');

    // Update or create test user
    await User.findOneAndUpdate(
      { email: 'testuser@gmail.com' },
      { 
        $set: { 
          password: hashedPassword,
          role: 'user',
          name: 'Test User'
        } 
      },
      { upsert: true }
    );
    console.log('Test user updated: testuser@gmail.com / userpassword');

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

setup();
