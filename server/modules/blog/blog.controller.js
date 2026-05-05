import Blog from "../../models/blog.model.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";

// ── GET all published blogs ─────────────────────────────────────────────────
export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ status: "published" }).sort({ order: 1, createdAt: -1 });
    res.status(200).json({ success: true, blogs });
  } catch (error) {
    console.error("[getBlogs Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET single blog by ID (increments views) ───────────────────────────────
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    res.status(200).json({ success: true, blog });
  } catch (error) {
    console.error("[getBlogById Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── LIKE a blog ────────────────────────────────────────────────────────────
export const likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    res.status(200).json({ success: true, blog });
  } catch (error) {
    console.error("[likeBlog Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE blog ────────────────────────────────────────────────────────────
export const createBlog = async (req, res) => {
  try {
    let imageUrl = req.body.imageUrl || "";

    // If a file was uploaded via multipart, push it to Cloudinary
    if (req.file) {
      console.log("[createBlog]: Uploading file to Cloudinary...");
      imageUrl = await uploadToCloudinary(req.file.buffer, "turfspot/blogs");
    }

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: "Article image is required" });
    }

    // Clean up numerical fields from FormData strings
    const blogData = {
      ...req.body,
      imageUrl,
      order: Number(req.body.order) || 0,
    };

    const blog = new Blog(blogData);
    await blog.save();
    res.status(201).json({ success: true, blog });
  } catch (error) {
    console.error("[createBlog Error]:", error);
    res.status(500).json({ success: false, message: "Internal Server Error during blog creation" });
  }
};

// ── UPDATE blog ────────────────────────────────────────────────────────────
export const updateBlog = async (req, res) => {
  try {
    const updates = { ...req.body };

    // If a new file was uploaded, replace the image on Cloudinary
    if (req.file) {
      console.log("[updateBlog]: Uploading new file to Cloudinary...");
      updates.imageUrl = await uploadToCloudinary(req.file.buffer, "turfspot/blogs");
    }

    // Ensure order is a number if provided
    if (updates.order) updates.order = Number(updates.order);

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

    // Update fields
    Object.keys(updates).forEach(key => {
      blog[key] = updates[key];
    });

    await blog.save();
    res.status(200).json({ success: true, blog });
  } catch (error) {
    console.error("[updateBlog Error]:", error);
    res.status(500).json({ success: false, message: "Internal Server Error during blog update" });
  }
};

// ── DELETE blog ────────────────────────────────────────────────────────────
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    res.status(200).json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    console.error("[deleteBlog Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
