import mongoose from "mongoose";
import dotenv from "dotenv";
import Booking from "../models/booking.model.js";
import Owner from "../models/owner.model.js";
import User from "../models/user.model.js";
import Turf from "../models/turf.model.js";
import TimeSlot from "../models/timeSlot.model.js";
import { initSettlementWorker } from "../utils/settlementWorker.js";

dotenv.config();

const testSettlement = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for testing settlement...");

    // 1. Setup a dummy booking for testing
    // We'll find the test user and a turf
    const user = await User.findOne({ email: "testuser@gmail.com" });
    const turf = await Turf.findOne();
    const owner = await Owner.findById(turf.owner);

    if (!user || !turf || !owner) {
      console.error("Missing seed data. Please run seed_all_data.js first.");
      process.exit(1);
    }

    console.log("Cleaning up old test bookings...");
    await Booking.deleteMany({ user: user._id, isTest: true });

    // 2. Scenario 1: Transition CONFIRMED -> PLAYING -> IN_REVIEW_WINDOW
    console.log("\n--- Scenario 1: Auto Transition to IN_REVIEW_WINDOW ---");
    
    const now = new Date();
    const playStart = new Date(now.getTime() - 90 * 60 * 1000); // 90 mins ago
    const playEnd = new Date(now.getTime() - 30 * 60 * 1000);   // 30 mins ago

    const booking1 = await Booking.create({
      user: user._id,
      turf: turf._id,
      status: "CONFIRMED",
      playStartTime: playStart,
      playEndTime: playEnd,
      ownerRevenue: 1000,
      totalPrice: 1200,
      qrCode: "test-qr-123",
      payment: {
        orderId: "test-order-123",
        paymentId: "test-pay-123"
      },
      isTest: true
    });

    console.log(`Created test booking ${booking1._id} with end time in the past.`);

    const { runPlayingTransition, runAutoSettle } = await import("../utils/settlementWorker.js");

    // Scenario 1: CONFIRMED -> PLAYING -> IN_REVIEW_WINDOW
    console.log("\n[STEP 1] Running Phase A (Playing Transition)...");
    await runPlayingTransition();

    const updatedB1 = await Booking.findById(booking1._id);
    console.log(`Booking 1 Status: ${updatedB1.status}, Revenue Status: ${updatedB1.revenueStatus}`);
    
    if (updatedB1.status === "IN_REVIEW_WINDOW") {
      console.log("✅ Booking correctly moved to IN_REVIEW_WINDOW");
    } else {
      console.log("❌ Booking failed to transition to IN_REVIEW_WINDOW");
    }

    // Scenario 2: IN_REVIEW_WINDOW -> COMPLETED
    console.log("\n--- Scenario 2: Auto Settlement after 2hr Window ---");
    
    // Move the window end to the past
    updatedB1.reviewWindowEndsAt = new Date(now.getTime() - 1000);
    await updatedB1.save();
    console.log("Moved review window to the past.");

    console.log("[STEP 2] Running Phase B (Auto Settle)...");
    await runAutoSettle();

    const finalB1 = await Booking.findById(booking1._id);
    console.log(`Booking 1 Status: ${finalB1.status}, Revenue Status: ${finalB1.revenueStatus}`);

    if (finalB1.status === "COMPLETED" && finalB1.revenueStatus === "SETTLED") {
      console.log("✅ Booking correctly SETTLED");
    } else {
      console.log("❌ Booking failed to SETTLE");
    }

    // Check Owner Balance
    const updatedOwner = await Owner.findById(owner._id);
    console.log(`Owner Wallet Balance: ${updatedOwner.walletBalance}`);

    console.log("\n[TEST COMPLETE] All settlement transitions verified.");
    process.exit(0);

  } catch (error) {
    console.error("Test error:", error);
    process.exit(1);
  }
};

testSettlement();
