import mongoose from "mongoose";
import dotenv from "dotenv";
import Video from "./models/video.model.js";

dotenv.config();

const checkDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    
    const count = await Video.countDocuments();
    console.log(`Total videos in DB: ${count}`);
    
    const videos = await Video.find();
    console.log("Videos:", JSON.stringify(videos, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkDB();
