import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server directory
dotenv.config({ path: path.join(__dirname, "../server/.env") });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("MONGO_URI not found in .env");
    process.exit(1);
}

// Define Schemas (minimal for check)
const ownerSchema = new mongoose.Schema({
    email: String,
    name: String
}, { collection: 'owners' });

const turfSchema = new mongoose.Schema({
    name: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner' }
}, { collection: 'turves' });

const Owner = mongoose.model('Owner', ownerSchema);
const Turf = mongoose.model('Turf', turfSchema);

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // The turfId from the screenshot URL: 6a007194ec73cb6767243948
        const turfId = "6a007194ec73cb6767243948";
        
        const turf = await Turf.findById(turfId).populate("owner");
        
        if (!turf) {
            console.log("Turf not found with ID:", turfId);
        } else {
            console.log("Turf found:", {
                id: turf._id,
                name: turf.name,
                ownerId: turf.owner ? turf.owner._id : "NULL (Raw: " + (await Turf.findById(turfId)).owner + ")",
                ownerPopulated: !!turf.owner
            });
            
            if (turf.owner) {
                console.log("Owner details:", turf.owner);
            } else {
                const rawTurf = await Turf.findById(turfId);
                const rawOwnerId = rawTurf.owner;
                if (rawOwnerId) {
                    const owner = await Owner.findById(rawOwnerId);
                    console.log("Searching for owner ID", rawOwnerId, "directly...");
                    console.log("Owner found directly:", !!owner);
                    if (owner) {
                        console.log("Owner data:", owner);
                    }
                }
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
