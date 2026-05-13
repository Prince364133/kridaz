import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const findUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = mongoose.model("User", new mongoose.Schema({ email: String, role: String, name: String }));
    const users = await User.find({}).limit(10);
    console.log(JSON.stringify(users, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

findUsers();
