import mongoose from "mongoose";
import argon2 from "argon2";
import dotenv from "dotenv";
import Owner from "./models/owner.model.js";

dotenv.config();

const seedAdmin = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI not found in environment variables.");
    process.exit(1);
  }

  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully.");

    const email = "admin@kridaz.com";
    const password = "364133";
    
    console.log(`Hashing password for ${email}...`);
    const hashedPassword = await argon2.hash(password);

    const existingAdmin = await Owner.findOne({ email });
    
    if (existingAdmin) {
      console.log("Admin account found. Updating password and ensuring admin role...");
      existingAdmin.password = hashedPassword;
      existingAdmin.role = "admin";
      await existingAdmin.save();
      console.log("Admin account updated.");
    } else {
      console.log("Creating new admin account...");
      await Owner.create({
        name: "Super Admin",
        email,
        password: hashedPassword,
        role: "admin"
      });
      console.log("Admin account created successfully.");
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
};

seedAdmin();
