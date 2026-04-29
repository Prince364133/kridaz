import mongoose from "mongoose";

export default async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to MongoDB: ${conn.connection.name}`);
    
    // Diagnostic: List available collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Available Collections:", collections.map(c => c.name));
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
    process.exit(1);
  }
}
