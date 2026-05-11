import mongoose from "mongoose";
import dotenv from "dotenv";
import Turf from "./models/turf.model.js";
import TimeSlot from "./models/timeSlot.model.js";
import Booking from "./models/booking.model.js";
import User from "./models/user.model.js";

dotenv.config();

const seedSlotsAndBookings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/kridaz");
    console.log("Connected to MongoDB...");

    const turfs = await Turf.find();
    const users = await User.find().limit(5);

    if (turfs.length === 0) {
      console.log("No turfs found to seed slots for.");
      process.exit(0);
    }

    if (users.length === 0) {
      console.log("No users found to create bookings for.");
      // Create a dummy user
      const dummyUser = new User({
        name: "Premium Player",
        email: "player@premium.com",
        phone: "9988776655",
        password: "hashed_password"
      });
      await dummyUser.save();
      users.push(dummyUser);
    }

    // Clear existing slots and bookings for these turfs to avoid duplicates
    const turfIds = turfs.map(t => t._id);
    await TimeSlot.deleteMany({ turf: { $in: turfIds } });
    await Booking.deleteMany({ turf: { $in: turfIds } });

    console.log("Cleared existing slots and bookings.");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const turf of turfs) {
      console.log(`Seeding slots for turf: ${turf.name}`);
      
      // Create slots for 3 days
      for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
        const slotDate = new Date(today);
        slotDate.setDate(today.getDate() + dayOffset);
        
        // Create 8 slots per day (from 10 AM to 6 PM)
        for (let hour = 10; hour < 18; hour++) {
          const startTime = new Date(slotDate);
          startTime.setHours(hour, 0, 0, 0);
          
          const endTime = new Date(slotDate);
          endTime.setHours(hour + 1, 0, 0, 0);

          const slot = new TimeSlot({
            turf: turf._id,
            startTime,
            endTime
          });
          await slot.save();

          // Randomly book some slots (30% chance)
          if (Math.random() < 0.3) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const booking = new Booking({
              user: randomUser._id,
              turf: turf._id,
              timeSlot: slot._id,
              totalPrice: turf.pricePerHour,
              qrCode: `QR_${Math.random().toString(36).substring(7).toUpperCase()}`,
              payment: {
                orderId: `ORDER_${Math.random().toString(36).substring(7).toUpperCase()}`,
                paymentId: `PAY_${Math.random().toString(36).substring(7).toUpperCase()}`
              }
            });
            await booking.save();
          }
        }
      }
    }

    console.log("Slots and bookings seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedSlotsAndBookings();
