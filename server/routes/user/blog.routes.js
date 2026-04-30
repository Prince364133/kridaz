import { Router } from "express";
import {
  getBlogs,
  getBlogById,
  likeBlog,
} from "../../modules/blog/blog.controller.js";

const router = Router();

router.get("/", getBlogs);
router.get("/:id", getBlogById);
router.post("/:id/like", likeBlog);

export default router;
