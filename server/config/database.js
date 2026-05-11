import mongoose from "mongoose";
import dns from 'node:dns/promises';

export default async function connectDB() {
  const host = process.env.MONGO_URI.split("@")[1].split(":")[0];
  try {
    const lookup = await dns.lookup(host);
    console.log(`[DATABASE] Host ${host} resolved to ${lookup.address}`);
  } catch (dnsErr) {
    console.error(`[DATABASE] DNS Resolution failed for ${host}:`, dnsErr.message);
  }

  console.log("[DATABASE] Attempting to connect to URI:", process.env.MONGO_URI.split("@")[1]); 
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000, 
      connectTimeoutMS: 15000,
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
