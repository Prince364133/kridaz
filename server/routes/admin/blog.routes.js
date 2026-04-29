import { Router } from "express";
import {
  getBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
} from "../../controllers/admin/blog.controller.js";

const router = Router();

router.get("/", getBlogs);
router.post("/", createBlog);
router.put("/:id", updateBlog);
router.delete("/:id", deleteBlog);

export default router;
