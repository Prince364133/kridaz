import mongoose from "mongoose";
import dotenv from "dotenv";
import * as argon2 from "argon2";
import Owner from "../models/owner.model.js";
import User from "../models/user.model.js";
import Match from "../models/match.model.js";
import Session from "../models/session.model.js";

dotenv.config();

const COACH_EMAIL = "11saafgdfviksolutions@gmail.com";
const UMPIRE_EMAIL = "saafgdfviksolutions@gmail.com";
const PASSWORD = "364133";

const seedPartnerData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/bookmysportz");
    console.log("Connected to MongoDB...");

    const hashedPassword = await argon2.hash(PASSWORD);

    // 1. Create/Update Coach
    let coach = await Owner.findOne({ email: COACH_EMAIL });
    if (!coach) {
      coach = new Owner({
        name: "Expert Coach",
        email: COACH_EMAIL,
        phone: "9876543210",
        password: hashedPassword,
        role: "coach"
      });
      await coach.save();
      console.log("Coach account created.");
    } else {
      coach.role = "coach";
      coach.password = hashedPassword;
      await coach.save();
      console.log("Coach account updated.");
    }

    // 2. Create/Update Umpire
    let umpire = await Owner.findOne({ email: UMPIRE_EMAIL });
    if (!umpire) {
      umpire = new Owner({
        name: "Pro Umpire",
        email: UMPIRE_EMAIL,
        phone: "9876543211",
        password: hashedPassword,
        role: "umpire"
      });
      await umpire.save();
      console.log("Umpire account created.");
    } else {
      umpire.role = "umpire";
      umpire.password = hashedPassword;
      await umpire.save();
      console.log("Umpire account updated.");
    }

    // 3. Create some Test Users (Students/Players)
    const users = await User.find().limit(5);
    let studentIds = users.map(u => u._id);
    if (studentIds.length === 0) {
      const newUser = new User({
        name: "Test Player",
        email: "player@test.com",
        phone: "1234567890",
        password: hashedPassword
      });
      await newUser.save();
      studentIds = [newUser._id];
      console.log("Test player created.");
    }

    // 4. Seed Matches for Umpire
    await Match.deleteMany({ umpire: umpire._id });
    const matches = [
      {
        name: "Corporate Cricket League - Final",
        venue: "Skyline Arena",
        date: new Date(Date.now() + 86400000), // Tomorrow
        time: "10:00 AM",
        umpire: umpire._id,
        status: "upcoming",
        teams: ["Tech Titans", "Finance Flyers"]
      },
      {
        name: "Weekend Bash - Group Stage",
        venue: "Green Field Turf",
        date: new Date(Date.now() + 172800000), // Day after tomorrow
        time: "04:00 PM",
        umpire: umpire._id,
        status: "upcoming",
        teams: ["Strikers FC", "United XI"]
      },
      {
        name: "Junior Championship",
        venue: "Olympic Sports Complex",
        date: new Date(Date.now() - 86400000), // Yesterday
        time: "09:00 AM",
        umpire: umpire._id,
        status: "completed",
        teams: ["Young Guns", "Rising Stars"],
        result: "Young Guns won by 2 wickets"
      }
    ];
    await Match.insertMany(matches);
    console.log("Matches seeded for Umpire.");

    // 5. Seed Sessions for Coach
    await Session.deleteMany({ coach: coach._id });
    const sessions = [
      {
        name: "Advanced Batting Drills",
        type: "Group",
        date: new Date(Date.now() + 43200000), // Today evening
        time: "06:00 PM",
        coach: coach._id,
        students: studentIds,
        status: "upcoming"
      },
      {
        name: "Private Bowling Masterclass",
        type: "Private",
        date: new Date(Date.now() + 259200000), // 3 days later
        time: "08:00 AM",
        coach: coach._id,
        students: [studentIds[0]],
        status: "upcoming"
      },
      {
        name: "Strength & Conditioning",
        type: "Group",
        date: new Date(Date.now() - 172800000), // 2 days ago
        time: "07:00 AM",
        coach: coach._id,
        students: studentIds,
        status: "completed"
      }
    ];
    await Session.insertMany(sessions);
    console.log("Sessions seeded for Coach.");

    console.log("Partner seeding successful!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedPartnerData();
