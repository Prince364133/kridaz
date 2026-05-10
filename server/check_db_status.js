import mongoose from "mongoose";
import dotenv from "dotenv";
import Owner from "./models/owner.model.js";

dotenv.config();

const checkStatus = async () => {
  const mongoUri = process.env.MONGO_URI;
  console.log("Checking database status...");
  
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ SUCCESS: Successfully connected to Railway MongoDB.");

    const dbName = mongoose.connection.name;
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📡 Database Name: ${dbName}`);
    console.log(`📊 Total Collections: ${collections.length}`);
    
    const adminUser = await Owner.findOne({ email: "admin@kridaz.com" });
    if (adminUser) {
      console.log("👤 Admin Account: Found (admin@kridaz.com)");
      console.log(`🏷️  Admin Role: ${adminUser.role}`);
    } else {
      console.log("⚠️  Admin Account: NOT FOUND (This is unexpected!)");
    }

    console.log("\nDatabase is LIVE and healthy.");
    process.exit(0);
  } catch (error) {
    console.error("❌ FAILURE: Could not connect to database.");
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

checkStatus();
