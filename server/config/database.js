import mongoose from "mongoose";

export default async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of default 30s
    });
    console.log(`[DATABASE] Connected: ${conn.connection.name}`);
    
    // Diagnostic: List available collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("[DATABASE] Available Collections:", collections.map(c => c.name));
    return conn;
  } catch (err) {
    console.error("[DATABASE] Error:", err.message);
    throw err; // Re-throw to be handled by the caller
  }
}
