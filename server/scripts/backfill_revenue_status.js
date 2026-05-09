import mongoose from "mongoose";
import dotenv from "dotenv";
import Booking from "../models/booking.model.js";
import connectDB from "../config/database.js";

dotenv.config();

const backfillRevenueStatus = async () => {
    try {
        await connectDB();
        console.log("Connected to database. Starting backfill...");

        // Find all bookings that don't have a revenueStatus field
        // We will mark them as CONFIRMED if they are old, or PENDING if new
        const result = await Booking.updateMany(
            { revenueStatus: { $exists: false } },
            { $set: { revenueStatus: "CONFIRMED" } }
        );

        console.log(`Backfill complete. Updated ${result.modifiedCount} bookings.`);
        process.exit(0);
    } catch (error) {
        console.error("Backfill failed:", error);
        process.exit(1);
    }
};

backfillRevenueStatus();
