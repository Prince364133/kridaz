import express from "express";
import { getAllFeatureFlags } from "../controllers/featureFlag.controller.js";
import { getActiveMarketing } from "../controllers/admin/marketing.controller.js";
import { getBlogs, getBlogById } from "../controllers/admin/blog.controller.js";

const router = express.Router();

router.get("/", getAllFeatureFlags);
router.get("/marketing", getActiveMarketing);
router.get("/blogs", getBlogs);
router.get("/blogs/:id", getBlogById);

export default router;
