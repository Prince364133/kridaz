import { Router } from "express";
import {
  getBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
} from "../../modules/blog/blog.controller.js";

import upload from "../../middleware/uploads/upload.middleware.js";

const router = Router();

router.get("/", getBlogs);
router.post("/", upload.single("image"), createBlog);
router.put("/:id", upload.single("image"), updateBlog);
router.delete("/:id", deleteBlog);

export default router;
