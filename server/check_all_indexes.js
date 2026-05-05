import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const checkIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    const collections = ["users", "transactions", "bookings"];
    for (const collName of collections) {
      const indexes = await mongoose.connection.db.collection(collName).indexes();
      console.log(`Indexes on '${collName}':`, JSON.stringify(indexes, null, 2));
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkIndex();
