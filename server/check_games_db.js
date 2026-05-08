import mongoose from "mongoose";
import HostedGame from "./models/hostedGame.model.js";
import User from "./models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const checkGames = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const games = await HostedGame.find().populate("host", "name email");
    console.log(JSON.stringify(games, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkGames();
