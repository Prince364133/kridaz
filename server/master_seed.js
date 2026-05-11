import mongoose from "mongoose";
import dotenv from "dotenv";
import Blog from "./models/blog.model.js";
import AdBanner from "./models/adBanner.model.js";
import Video from "./models/video.model.js";

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
    views: 1200,
    likes: 450,
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
    views: 890,
    likes: 312,
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
    views: 2400,
    likes: 890,
    order: 3
  }
];

const banners = [
  {
    title: "SUMMER SPORTS FESTIVAL 2024",
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1600&q=80",
    targetUrl: "/events/summer-fest",
    order: 1,
    isActive: true
  },
  {
    title: "EXCLUSIVE TURF DISCOUNTS",
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=80",
    targetUrl: "/offers",
    order: 2,
    isActive: true
  }
];

const videos = [
  {
    title: "KRIDAZ: THE FUTURE OF SPORTS",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    order: 1,
    isActive: true
  },
  {
    title: "HOW TO BOOK YOUR FIRST TURF",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    order: 2,
    isActive: true
  }
];

const seedAll = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/kridaz");
    console.log("Connected to MongoDB...");

    await Blog.deleteMany({});
    for (const blog of blogs) {
      await Blog.create(blog);
    }
    console.log("Blogs seeded.");

    await AdBanner.deleteMany({});
    for (const banner of banners) {
      await AdBanner.create(banner);
    }
    console.log("Banners seeded.");

    await Video.deleteMany({});
    for (const video of videos) {
      await Video.create(video);
    }
    console.log("Videos seeded.");

    console.log("Master seed complete!");
    process.exit();
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedAll();
