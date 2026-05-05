import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixUsers() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');

  // Find users where locationData exists but coordinates is not an array
  const result = await usersCollection.updateMany(
    { 
      locationData: { $exists: true },
      $or: [
        { "locationData.coordinates": { $exists: false } },
        { "locationData.coordinates": { $not: { $type: "array" } } }
      ]
    },
    { 
      $set: { 
        locationData: {
          type: "Point",
          coordinates: [0, 0]
        }
      } 
    }
  );

  console.log(`Matched ${result.matchedCount} and modified ${result.modifiedCount} users`);
  process.exit(0);
}

fixUsers();
