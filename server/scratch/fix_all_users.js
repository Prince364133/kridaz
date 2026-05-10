import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixAll() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const usersCollection = mongoose.connection.db.collection('users');
  
  // 1. Set default locationData for anyone missing it or having invalid coordinates
  const result = await usersCollection.updateMany(
    {
      $or: [
        { locationData: { $exists: false } },
        { "locationData.type": { $ne: "Point" } },
        { "locationData.coordinates": { $exists: false } },
        { "locationData.coordinates": { $not: { $type: "array" } } },
        { "locationData.coordinates": { $size: 0 } }
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

  console.log(`Updated ${result.modifiedCount} users to valid locationData`);
  
  // 2. Also ensure everyone has a name to avoid UI issues
  const result2 = await usersCollection.updateMany(
    { name: { $exists: false } },
    { $set: { name: "Kridaz Player" } }
  );
  console.log(`Updated ${result2.modifiedCount} users with missing names`);

  process.exit(0);
}

fixAll();
