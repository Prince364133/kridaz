import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { performance } from 'perf_hooks';

dotenv.config({ path: './server/.env' });

async function diagnose() {
  console.log("Starting Database Diagnostic...");
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not found in .env");
    process.exit(1);
  }

  const start = performance.now();
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    const connected = performance.now();
    console.log(`Connected in ${(connected - start).toFixed(2)}ms`);

    console.log("Performing simple query (count users)...");
    const queryStart = performance.now();
    const count = await mongoose.connection.db.collection('users').countDocuments();
    const queryEnd = performance.now();
    console.log(`Query took ${(queryEnd - queryStart).toFixed(2)}ms. Found ${count} users.`);

    await mongoose.disconnect();
    console.log("Disconnected.");
  } catch (err) {
    console.error("Diagnostic failed:", err.message);
  }
}

diagnose();
