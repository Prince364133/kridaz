import mongoose from "mongoose";
import dotenv from "dotenv";
import Turf from "./models/turf.model.js";
import Owner from "./models/owner.model.js";

dotenv.config();

const listTurfs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const turfs = await Turf.find().populate("owner");
    turfs.forEach(t => {
      console.log(`Turf: ${t.name} | Owner: ${t.owner?.email} | Role: ${t.owner?.role} | ID: ${t._id}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

listTurfs();
