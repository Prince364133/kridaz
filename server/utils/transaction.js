import mongoose from "mongoose";

/**
 * Executes a function within a MongoDB session/transaction if supported.
 * Falls back to normal execution if the environment does not support replica sets.
 * 
 * @param {Function} fn - The async function to execute. Receives { session, isTransactional }.
 * @returns {Promise<any>} - The result of the function.
 */
export const runInTransaction = async (callback) => {
  let session = null;
  let isTransactional = false;

  try {
    // 1. Check if we are in a replica set environment by trying to start a session and transaction
    try {
      const client = mongoose.connection.getClient();
      const topologyType = client?.topology?.description?.type;
      
      const isStandalone = topologyType === 'Single' || topologyType === 'Unknown';

      if (!isStandalone) {
        session = await mongoose.startSession();
        session.startTransaction();
        isTransactional = true;
        console.log(`🔗 MongoDB Transaction Started (Topology: ${topologyType})`);
      } else {
        isTransactional = false;
        console.warn(`⚠️ Standalone MongoDB detected (Topology: ${topologyType}). Transactions disabled.`);
      }
    } catch (error) {
      console.warn("⚠️ Transaction detection failed:", error.message);
      isTransactional = false;
      if (session) {
        await session.endSession();
        session = null;
      }
    }

    try {
      // Pass undefined for session if not transactional to ensure Mongoose ignores it
      const result = await callback({ 
        session: isTransactional ? session : undefined,
        isTransactional 
      });
      
      if (isTransactional && session) {
        await session.commitTransaction();
        console.log("✅ MongoDB Transaction Committed");
      }
      return result;
    } catch (error) {
      if (isTransactional && session) {
        console.error("❌ Transaction Aborting due to error:", error.message);
        await session.abortTransaction();
      }
      throw error;
    }
  } finally {
    if (session) {
      try {
        await session.endSession();
        console.log("🔒 MongoDB Session Ended");
      } catch (e) {
        console.error("❌ Error closing session:", e.message);
      }
    }
  }
};
