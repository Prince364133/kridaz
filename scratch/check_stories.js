import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: 'server/.env' });

async function checkStories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    const Story = mongoose.model('Story', new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      userModel: String,
      expiresAt: { type: Date, required: true },
      content: String
    }));

    const now = new Date();
    const allStories = await Story.find();
    console.log(`Total stories in DB: ${allStories.length}`);
    
    allStories.forEach(s => {
      console.log(`- Story ID: ${s._id}, User: ${s.userId}, Model: ${s.userModel}, Expires: ${s.expiresAt}, Active: ${s.expiresAt > now}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkStories();
