import mongoose from "mongoose";
import dotenv from "dotenv";
import HostedGame from "../models/hostedGame.model.js";
import { generateShortId } from "../modules/scoring/scoring.utils.js";

dotenv.config({ path: "./server/.env" });

const backfill = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const games = await HostedGame.find({ shortId: { $exists: false } });
    console.log(`Found ${games.length} games to backfill`);

    for (const game of games) {
      game.shortId = generateShortId();
      await game.save();
      console.log(`Backfilled game: ${game._id} with ID: ${game.shortId}`);
    }

    console.log("Backfill completed!");
    process.exit(0);
  } catch (error) {
    console.error("Backfill failed:", error);
    process.exit(1);
  }
};

backfill();
