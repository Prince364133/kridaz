import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config();

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = "saafgdfviksolutions@gmail.com";
    const user = await User.findOne({ email });
    if (user) {
      console.log(`[CHECK] User found: ${user.name} (${user.email})`);
    } else {
      console.log(`[CHECK] User NOT found: ${email}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkUser();
