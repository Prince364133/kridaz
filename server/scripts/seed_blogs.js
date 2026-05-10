import mongoose from "mongoose";
import Blog from "./models/blog.model.js";
import dotenv from "dotenv";

dotenv.config();

const blogs = [
  {
    title: "RISING STARS: KISHORE JENA AND NEERAJ CHOPRA",
    subtitle: "A deep dive into India's javelin dominance.",
    content: "Full analysis of the recent performance...",
    imageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80",
    readTime: "2 MINS READ",
    date: "23RD JULY 2024",
    category: "Sports",
    views: "1.2k",
    likes: "450",
    order: 1
  },
  {
    title: "EMPOWERING INNINGS: THE RISE OF WOMEN'S CRICKET",
    subtitle: "How the women's game is taking center stage.",
    content: "Detailed report on the evolution...",
    imageUrl: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80",
    readTime: "3 MINS READ",
    date: "11TH JULY 2024",
    category: "Cricket",
    views: "890",
    likes: "312",
    order: 2
  },
  {
    title: "AND THAT WAS THE FINAL: ANALYZING THE CLASH",
    subtitle: "Tactical breakdown of the championship match.",
    content: "Every move analyzed...",
    imageUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80",
    readTime: "1 MIN READ",
    date: "20TH MAY 2024",
    category: "Football",
    views: "2.4k",
    likes: "890",
    order: 3
  },
  {
    title: "CRICKETING GLORY: INDIA'S WORLD CUP JOURNEY",
    subtitle: "A journey through the historic victory.",
    content: "The path to the trophy...",
    imageUrl: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80",
    readTime: "5 MINS READ",
    date: "17TH MAY 2024",
    category: "Cricket",
    views: "3.1k",
    likes: "1.2k",
    order: 4
  }
];

const seedBlogs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/kridaz");
    console.log("Connected to MongoDB for seeding blogs...");

    await Blog.deleteMany({});
    console.log("Cleared existing blogs.");

    await Blog.insertMany(blogs);
    console.log("Successfully seeded blogs!");

    process.exit();
  } catch (error) {
    console.error("Error seeding blogs:", error);
    process.exit(1);
  }
};

seedBlogs();
