import mongoose from "mongoose";
import dotenv from "dotenv";
import Owner from "../models/owner.model.js";
import User from "../models/user.model.js";

dotenv.config();

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const owners = await Owner.find({}, "email name role");
    console.log("Owners:", owners);

    const users = await User.find({}, "email name role");
    console.log("Users:", users);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

listUsers();
