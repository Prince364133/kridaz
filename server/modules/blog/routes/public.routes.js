import { Router } from "express";
import { getBlogs, getBlogById } from "../blog.controller.js";

const router = Router();

/**
 * @swagger
 * /features/blogs:
 *   get:
 *     summary: Get list of public blogs
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Blog list
 */
router.get("/", getBlogs);

/**
 * @swagger
 * /features/blogs/{id}:
 *   get:
 *     summary: Get public blog details
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Blog data
 */
router.get("/:id", getBlogById);

export default router;
