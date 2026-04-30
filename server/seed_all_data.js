import mongoose from "mongoose";
import dotenv from "dotenv";
import Turf from "./models/turf.model.js";
import Owner from "./models/owner.model.js";
import User from "./models/user.model.js";
import Booking from "./models/booking.model.js";
import TimeSlot from "./models/timeSlot.model.js";
import crypto from "crypto";

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not found in .env file");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB...");

    // 1. Create or find Owner
    let owner = await Owner.findOne({ email: "admin@turfspot.com" });
    if (!owner) {
      owner = await Owner.create({
        name: "Admin Owner",
        email: "admin@turfspot.com",
        password: "adminpassword",
        phone: "9999999999",
        role: "admin",
      });
      console.log("Created owner: admin@turfspot.com");
    }

    // 2. Create or find User
    let user = await User.findOne({ email: "testuser@gmail.com" });
    if (!user) {
      user = await User.create({
        name: "Test Athlete",
        email: "testuser@gmail.com",
        password: "userpassword",
      });
      console.log("Created user: testuser@gmail.com");
    }

    // 3. Clear existing data
    await Booking.deleteMany({});
    await TimeSlot.deleteMany({});
    await Turf.deleteMany({});
    console.log("Cleared old data...");

    // 4. Create Turfs
    const turfsData = [
      {
        name: "Thunder Arena",
        description: "Premium FIFA-quality turf.",
        location: "Gachibowli, Hyderabad",
        image: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80",
        sportTypes: ["Football"],
        pricePerHour: 1500,
        openTime: "06:00",
        closeTime: "23:00",
        owner: owner._id,
      },
      {
        name: "Cricket Central",
        description: "Multi-pitch cricket facility.",
        location: "Jubilee Hills, Hyderabad",
        image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80",
        sportTypes: ["Cricket"],
        pricePerHour: 2000,
        openTime: "05:00",
        closeTime: "22:00",
        owner: owner._id,
      }
    ];

    const seededTurfs = await Turf.insertMany(turfsData);
    console.log(`${seededTurfs.length} Turfs created.`);

    // 5. Create TimeSlots and Bookings for each turf
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const turf of seededTurfs) {
      // Create 3 slots for today
      for (let i = 0; i < 3; i++) {
        const startTime = new Date(today);
        startTime.setHours(10 + i, 0, 0, 0);
        const endTime = new Date(today);
        endTime.setHours(11 + i, 0, 0, 0);

        const slot = await TimeSlot.create({
          turf: turf._id,
          startTime,
          endTime,
        });

        // Book 2 out of 3 slots
        if (i < 2) {
          await Booking.create({
            user: user._id,
            turf: turf._id,
            timeSlot: slot._id,
            totalPrice: turf.pricePerHour,
            qrCode: crypto.randomBytes(16).toString("hex"),
            payment: {
              orderId: `order_${crypto.randomBytes(8).toString("hex")}`,
              paymentId: `pay_${crypto.randomBytes(8).toString("hex")}`,
            }
          });
        }
      }
    }

    console.log("Seeded Bookings and TimeSlots successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seedData();
