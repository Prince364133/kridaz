import mongoose from "mongoose";
import dotenv from "dotenv";
import Turf from "./models/turf.model.js";
import Owner from "./models/owner.model.js";
import User from "./models/user.model.js";

dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const turfId = "6a007194ec73cb6767243948";
        const turf = await Turf.findById(turfId);
        
        if (!turf) {
            console.log("Turf not found");
            return;
        }

        console.log("Turf found:", turf.name);
        console.log("Owner ID in Turf:", turf.owner);

        const owner = await Owner.findById(turf.owner);
        console.log("Found in Owners collection:", !!owner);
        if (owner) {
            console.log("Owner Name:", owner.name);
        } else {
            const user = await User.findById(turf.owner);
            console.log("Found in Users collection:", !!user);
            if (user) {
                console.log("User Name:", user.name);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
