import mongoose from "mongoose";
import dotenv from "dotenv";
import * as argon2 from "argon2";
import Owner from "../models/owner.model.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not found in .env file");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB...");

    const email = "admin@gmail.com";
    const password = "364133";
    const hashedPassword = await argon2.hash(password);

    let admin = await Owner.findOne({ email });

    if (admin) {
      admin.password = hashedPassword;
      admin.role = "admin";
      await admin.save();
      console.log(`Updated existing admin: ${email}`);
    } else {
      admin = await Owner.create({
        name: "Platform Admin",
        email: email,
        password: hashedPassword,
        phone: "0000000000",
        role: "admin",
      });
      console.log(`Created new admin: ${email}`);
    }

    console.log("Admin credentials seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin credentials:", error);
    process.exit(1);
  }
};

seedAdmin();
