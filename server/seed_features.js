import mongoose from "mongoose";
import dotenv from "dotenv";
import FeatureFlag from "./models/featureFlag.model.js";

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookmysportz");
    console.log("Connected to MongoDB.");

    const defaultFlags = [
      {
        key: "find_professionals",
        name: "Find Professionals Section",
        description: "Show the Find Professionals card section on the landing page.",
        enabled: true,
      },
      {
        key: "join_games",
        name: "Join Games Near You Section",
        description: "Show the Join Games Near You card section on the landing page.",
        enabled: true,
      },
    ];

    for (const df of defaultFlags) {
      await FeatureFlag.updateOne({ key: df.key }, { $set: df }, { upsert: true });
    }

    console.log("Feature flags seeded successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
};

seed();
