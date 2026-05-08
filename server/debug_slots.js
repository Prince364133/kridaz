import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const debugSlots = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    const turves = await mongoose.connection.db.collection("turves").find({}).toArray();
    console.log(`Checking slots for ${turves.length} turfs...`);
    
    turves.forEach(t => {
      console.log(`\nTurf: ${t.name} (${t._id})`);
      console.log(`Open: ${t.openTime}, Close: ${t.closeTime}`);
      console.log(`Generated Slots Count: ${t.generatedSlots ? t.generatedSlots.length : 0}`);
      if (t.generatedSlots && t.generatedSlots.length > 0) {
        console.log(`First 3 slots:`, t.generatedSlots.slice(0, 3).map(s => s.startTime).join(", "));
      }
    });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

debugSlots();
