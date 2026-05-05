import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const fixTurfIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    
    const collection = mongoose.connection.db.collection("turves");
    const indexes = await collection.indexes();
    console.log("Current indexes on 'turves':", JSON.stringify(indexes, null, 2));

    for (const idx of indexes) {
      if (idx.key && (idx.key["locationData"] === "2dsphere" || idx.key["locationData.coordinates"] === "2dsphere")) {
        console.log(`Dropping index: ${idx.name}`);
        await collection.dropIndex(idx.name);
      }
    }

    console.log("Indexes dropped. Mongoose will recreate them on next start.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error fixing turf indexes:", err);
    process.exit(1);
  }
};

fixTurfIndexes();
