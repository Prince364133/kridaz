import mongoose from "mongoose";
import dotenv from "dotenv";
import Turf from "./models/turf.model.js";

dotenv.config();

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const count = await Turf.countDocuments();
    console.log(`[CHECK] Turf count: ${count}`);
    const sample = await Turf.findOne();
    console.log(`[CHECK] Sample:`, sample);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkData();
