import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns/promises";

dotenv.config({ path: "./.env" });

async function runDiag() {
  let uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not found in .env");
    process.exit(1);
  }

  // Appending options to URI for testing
  const separator = uri.includes("?") ? "&" : "?";
  const testUri = `${uri}${separator}directConnection=true&authSource=admin`;

  console.log("Using Test MONGO_URI:", testUri.replace(/:[^:]*@/, ":****@")); // Mask password

  const host = uri.split("@")[1].split(":")[0];
  try {
    const lookup = await dns.lookup(host);
    console.log(`DNS Lookup successful: ${host} -> ${lookup.address}`);
  } catch (err) {
    console.error(`DNS Lookup failed for ${host}:`, err.message);
  }

  console.log("Attempting Mongoose connection with directConnection=true...");
  try {
    const conn = await mongoose.connect(testUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log("SUCCESS! Connected to DB:", conn.connection.name);
    
    // Check if we can run a basic admin command
    const admin = conn.connection.db.admin();
    const serverStatus = await admin.serverStatus();
    console.log("Server Version:", serverStatus.version);
    console.log("Active Connections:", serverStatus.connections);
    
    await mongoose.disconnect();
    console.log("Disconnected successfully.");
  } catch (err) {
    console.error("\n--- CONNECTION FAILED ERROR DETAILS ---");
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    if (err.reason) {
      console.error("Error Reason:\n", JSON.stringify(err.reason, null, 2));
    }
    console.error("---------------------------------------\n");
    process.exit(1);
  }
}

runDiag();
