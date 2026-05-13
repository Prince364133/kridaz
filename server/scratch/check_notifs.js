import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const Notification = mongoose.model("Notification", new mongoose.Schema({ recipient: mongoose.Schema.Types.ObjectId, title: String, recipientModel: String }));
    const n = await Notification.find().sort({ createdAt: -1 }).limit(10);
    console.log(JSON.stringify(n, null, 2));
    await mongoose.disconnect();
};

run();
