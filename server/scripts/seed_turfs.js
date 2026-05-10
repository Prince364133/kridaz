import mongoose from "mongoose";
import dotenv from "dotenv";
import Turf from "./models/turf.model.js";
import Owner from "./models/owner.model.js";

dotenv.config();

const turfs = [
  {
    name: "Thunder Arena",
    description: "Premium FIFA-quality turf for professional football matches.",
    location: "Gachibowli, Hyderabad",
    image: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=80",
    sportTypes: ["Football"],
    pricePerHour: 1500,
    openTime: "06:00",
    closeTime: "23:00",
  },
  {
    name: "Cricket Central",
    description: "Multi-pitch cricket facility with floodlights and high-quality nets.",
    location: "Jubilee Hills, Hyderabad",
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80",
    sportTypes: ["Cricket"],
    pricePerHour: 2000,
    openTime: "05:00",
    closeTime: "22:00",
  },
  {
    name: "Badminton Hub",
    description: "Indoor wooden court facility with professional lighting.",
    location: "Kukatpally, Hyderabad",
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80",
    sportTypes: ["Badminton"],
    pricePerHour: 500,
    openTime: "06:00",
    closeTime: "22:00",
  },
  {
    name: "Swim & Smash",
    description: "Olympic-sized swimming pool and tennis courts complex.",
    location: "Banjara Hills, Hyderabad",
    image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&q=80",
    sportTypes: ["Swimming", "Tennis"],
    pricePerHour: 1200,
    openTime: "05:00",
    closeTime: "21:00",
  },
  {
    name: "Elite Tennis Club",
    description: "Pristine clay courts for the ultimate tennis experience.",
    location: "Indiranagar, Bengaluru",
    image: "https://images.unsplash.com/photo-1622279457486-62dcc4a4bd13?w=800&q=80",
    sportTypes: ["Tennis"],
    pricePerHour: 800,
    openTime: "06:00",
    closeTime: "21:00",
  },
  {
    name: "Goal Factory",
    description: "High-intensity 5-a-side football arena.",
    location: "Koramangala, Bengaluru",
    image: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&q=80",
    sportTypes: ["Football"],
    pricePerHour: 1800,
    openTime: "07:00",
    closeTime: "00:00",
  }
];

const seedTurfs = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI not found in .env file");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB...");

    // Find or create an owner
    let owner = await Owner.findOne({ email: "admin@kridaz.com" });
    if (!owner) {
      owner = await Owner.create({
        name: "Admin",
        email: "admin@kridaz.com",
        password: "adminpassword", 
        phone: "9999999999",
        role: "admin",
      });
      console.log("Created default admin owner.");
    }

    // Add owner ID to turfs
    const turfsWithOwner = turfs.map(t => ({ ...t, owner: owner._id }));

    await Turf.deleteMany({});
    await Turf.insertMany(turfsWithOwner);
    console.log(`${turfsWithOwner.length} Turfs seeded successfully.`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding turfs:", error);
    process.exit(1);
  }
};

seedTurfs();
