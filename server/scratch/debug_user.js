import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function debug() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await mongoose.connection.db.collection('users').findOne({ _id: new mongoose.Types.ObjectId('69cdea4e29f5bbf714eb2aab') });
  console.log('User:', JSON.stringify(user, null, 2));
  process.exit(0);
}

debug();
