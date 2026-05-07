import mongoose from "mongoose";

export default async function connectDB() {
  console.log("[DATABASE] Attempting to connect to URI:", process.env.MONGO_URI.split("@")[1]); // Log host part only for security
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // Wait 10s
      connectTimeoutMS: 10000,
    });
    console.log(`[DATABASE] Success! Connected to database: ${conn.connection.name}`);
    
    // List collections to verify access
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("[DATABASE] Available Collections:", collections.map(c => c.name));
    return conn;
  } catch (err) {
    console.error("[DATABASE] Connection Failed!");
    console.error("[DATABASE] Error Name:", err.name);
    console.error("[DATABASE] Error Message:", err.message);
    if (err.reason) {
      console.error("[DATABASE] Error Reason:", JSON.stringify(err.reason, null, 2));
    }
    throw err;
  }
}
