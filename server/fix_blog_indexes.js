import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const fixIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    
    const collection = mongoose.connection.db.collection("blogs");
    const indexes = await collection.indexes();
    console.log("Current indexes on 'blogs':", JSON.stringify(indexes, null, 2));

    const slugIndex = indexes.find(idx => idx.name === "slug_1");
    if (slugIndex) {
      console.log("Dropping problematic unique index: slug_1");
      await collection.dropIndex("slug_1");
      console.log("Index dropped successfully.");
    } else {
      console.log("No 'slug_1' index found.");
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error fixing indexes:", err);
    process.exit(1);
  }
};

fixIndexes();
