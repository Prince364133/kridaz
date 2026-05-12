import mongoose from "mongoose";
import dotenv from "dotenv";
import Owner from "../models/owner.model.js";

dotenv.config();

const findAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admin = await Owner.findOne({ email: "admin@kridaz.com" });
    console.log("Admin found:", admin ? admin.email : "NOT FOUND");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

findAdmin();
