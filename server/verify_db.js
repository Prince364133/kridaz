import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/turfspot";

async function checkDatabase() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully.");

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("\nCollections in database:");
    collections.forEach(c => console.log(` - ${c.name}`));

    const Turf = mongoose.model("Turf", new mongoose.Schema({}, { strict: false }), "turves");
    const count = await Turf.countDocuments();
    
    console.log(`\nTurf Count (in 'turves' collection): ${count}`);
    
    if (count > 0) {
      const sample = await Turf.findOne();
      console.log("\nSample Turf:");
      console.log(JSON.stringify(sample, null, 2));
    } else {
      console.log("\n[!] WARNING: No turfs found. You may need to run 'node seed_turfs.js'");
    }

    process.exit(0);
  } catch (error) {
    console.error("\n[!] ERROR connecting to database:", error.message);
    process.exit(1);
  }
}

checkDatabase();
