import mongoose from "mongoose";
import argon2 from "argon2";
import dotenv from "dotenv";
import User from "./models/user.model.js";
import Owner from "./models/owner.model.js";

dotenv.config();

const nukeAndSeed = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI not found in environment variables.");
    process.exit(1);
  }

  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully.");

    // 1. Delete all data
    console.log("Nuking database (dropping database)...");
    await mongoose.connection.db.dropDatabase();
    console.log("Database dropped successfully.");

    // 2. Seed Admin
    const email = "admin@kridaz.com";
    const password = "364133";
    
    console.log(`Hashing password for ${email}...`);
    const hashedPassword = await argon2.hash(password);

    console.log("Creating new admin identity (User + Owner)...");
    
    // Create User record
    const newUser = await User.create({
      name: "Super Admin",
      email: email,
      password: hashedPassword,
      role: "admin",
      status: "active"
    });

    // Create Owner record linked to User
    await Owner.create({
      userId: newUser._id,
      name: "Super Admin",
      email: email,
      password: hashedPassword,
      role: "admin"
    });

    console.log("-----------------------------------------");
    console.log("SUCCESS: Database nuked and Admin seeded!");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log("-----------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("Error during nuke and seed:", error);
    process.exit(1);
  }
};

nukeAndSeed();
