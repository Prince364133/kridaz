import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const checkTopology = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const client = mongoose.connection.getClient();
    const topologyType = client.topology.description.type;
    console.log("Topology Type:", topologyType);
    
    // Check if isMaster works
    const isMaster = await mongoose.connection.db.admin().command({ isMaster: 1 });
    console.log("IsMaster Result:", !!isMaster.setName ? "ReplicaSet" : "Standalone");
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkTopology();
