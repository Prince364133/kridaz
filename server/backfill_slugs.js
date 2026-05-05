import mongoose from "mongoose";
import Blog from "./models/blog.model.js";
import dotenv from "dotenv";
dotenv.config();

const backfillSlugs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const blogs = await Blog.find({ slug: { $exists: false } });
    console.log(`Found ${blogs.length} blogs without slugs.`);

    for (const blog of blogs) {
      console.log(`Generating slug for: ${blog.title}`);
      // Saving will trigger the pre-save hook we just added
      await blog.save();
    }

    console.log("Backfill complete.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error backfilling slugs:", err);
    process.exit(1);
  }
};

backfillSlugs();
