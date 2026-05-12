import mongoose from "mongoose";
import dotenv from "dotenv";
import Owner from "../models/owner.model.js";

dotenv.config();

const addBalance = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admin = await Owner.findOne({ email: "admin@kridaz.com" });
    if (admin) {
      admin.walletBalance = (admin.walletBalance || 0) + 10000;
      await admin.save();
      console.log("Admin balance updated to:", admin.walletBalance);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

addBalance();
