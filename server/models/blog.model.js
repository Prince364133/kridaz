import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    readTime: {
      type: String,
      default: "5 mins read",
    },
    date: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "General",
    },
    author: {
      type: String,
      default: "BookMySportz Team",
    },
    views: {
      type: String,
      default: "0",
    },
    likes: {
      type: String,
      default: "0",
    },
    order: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
