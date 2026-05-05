import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const fixTurfCoords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    
    // Hyderabad coordinates
    const lng = 78.4867;
    const lat = 17.3850;

    const result = await mongoose.connection.db.collection("turves").updateMany(
      { "locationData.coordinates": { $exists: false } },
      { 
        $set: { 
          locationData: {
            type: "Point",
            coordinates: [lng, lat]
          },
          city: "Hyderabad",
          state: "Telangana"
        } 
      }
    );

    console.log(`Updated ${result.modifiedCount} turfs with default coordinates.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error fixing turf coordinates:", err);
    process.exit(1);
  }
};

fixTurfCoords();
