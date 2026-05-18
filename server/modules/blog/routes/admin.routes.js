import { Router } from "express";
import {
  getBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
} from "../blog.controller.js";

import upload from "../../../middleware/uploads/upload.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin Blog
 *   description: Administrative blog post management
 */

/**
 * @swagger
 * /blog/admin:
 *   get:
 *     summary: List all blog posts
 *     tags: [Admin Blog]
 *     responses:
 *       200:
 *         description: List of blogs
 *   post:
 *     summary: Create a new blog post
 *     tags: [Admin Blog]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Blog created
 */
router.get("/", getBlogs);
router.post("/", upload.single("image"), createBlog);

/**
 * @swagger
 * /blog/admin/{id}:
 *   put:
 *     summary: Update an existing blog
 *     tags: [Admin Blog]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Blog updated
 *   delete:
 *     summary: Delete a blog post
 *     tags: [Admin Blog]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Blog deleted
 */
router.put("/:id", upload.single("image"), updateBlog);
router.delete("/:id", deleteBlog);

export default router;
