import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const checkTurfs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    const turfs = await mongoose.connection.db.collection("turves").find({}).toArray();
    console.log("Total turfs in DB:", turfs.length);
    turfs.forEach(t => {
      console.log(`\n---`);
      console.log(`Name: ${t.name}`);
      console.log(`Status: ${t.status}`);
      console.log(`isActive: ${t.isActive}`);
      console.log(`city: ${t.city}`);
      console.log(`state: ${t.state}`);
      console.log(`locationData: ${JSON.stringify(t.locationData)}`);
    });
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkTurfs();
