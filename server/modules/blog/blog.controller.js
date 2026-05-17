import { prisma } from "../../config/prisma.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";
import logger from "../../utils/logger.js";

// ── GET all published blogs ─────────────────────────────────────────────────
export const getBlogs = async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      where: { status: "published" },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    res.status(200).json({ success: true, blogs });
  } catch (error) {
    logger.error("[getBlogs Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET single blog by ID (increments views) ───────────────────────────────
export const getBlogById = async (req, res) => {
  try {
    const blog = await prisma.blog.update({
      where: { id: req.params.id },
      data: { views: { increment: 1 } }
    });
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    res.status(200).json({ success: true, blog });
  } catch (error) {
    logger.error("[getBlogById Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── LIKE a blog ────────────────────────────────────────────────────────────
export const likeBlog = async (req, res) => {
  try {
    const blog = await prisma.blog.update({
      where: { id: req.params.id },
      data: { likes: { increment: 1 } }
    });
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    res.status(200).json({ success: true, blog });
  } catch (error) {
    logger.error("[likeBlog Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── CREATE blog ────────────────────────────────────────────────────────────
export const createBlog = async (req, res) => {
  try {
    let imageUrl = req.body.imageUrl || "";

    // If a file was uploaded via multipart, push it to Cloudinary
    if (req.file) {
      logger.info("[createBlog]: Uploading file to Cloudinary...");
      imageUrl = await uploadToCloudinary(req.file.buffer, "kridaz/blogs");
    }

    if (!imageUrl) {
      return res.status(400).json({ success: false, message: "Article image is required" });
    }

    const { title, content, author, category, tags, status, order } = req.body;

    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        author,
        imageUrl,
        category,
        tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
        status: status || "draft",
        order: Number(order) || 0,
      }
    });

    res.status(201).json({ success: true, blog });
  } catch (error) {
    logger.error("[createBlog Error]:", error);
    res.status(500).json({ success: false, message: "Internal Server Error during blog creation" });
  }
};

// ── UPDATE blog ────────────────────────────────────────────────────────────
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // If a new file was uploaded, replace the image on Cloudinary
    if (req.file) {
      logger.info("[updateBlog]: Uploading new file to Cloudinary...");
      updates.imageUrl = await uploadToCloudinary(req.file.buffer, "kridaz/blogs");
    }

    // Ensure order is a number if provided
    if (updates.order) updates.order = Number(updates.order);
    if (updates.tags && typeof updates.tags === 'string') {
        updates.tags = updates.tags.split(',').map(t => t.trim());
    }

    const blog = await prisma.blog.update({
      where: { id },
      data: updates
    });

    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

    res.status(200).json({ success: true, blog });
  } catch (error) {
    logger.error("[updateBlog Error]:", error);
    res.status(500).json({ success: false, message: "Internal Server Error during blog update" });
  }
};

// ── DELETE blog ────────────────────────────────────────────────────────────
export const deleteBlog = async (req, res) => {
  try {
    await prisma.blog.delete({ where: { id: req.params.id } });
    res.status(200).json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    logger.error("[deleteBlog Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

