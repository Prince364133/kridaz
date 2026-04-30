import express from "express";
import { getAllFeatureFlags } from "../modules/admin/featureFlag.controller.js";
import { getActiveMarketing } from "../modules/marketing/marketing.controller.js";
import { getBlogs, getBlogById } from "../modules/blog/blog.controller.js";

const router = express.Router();

router.get("/", getAllFeatureFlags);
router.get("/marketing", getActiveMarketing);
router.get("/blogs", getBlogs);
router.get("/blogs/:id", getBlogById);

export default router;
