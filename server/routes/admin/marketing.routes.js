import { Router } from "express";
import {
  getAdBanners,
  createAdBanner,
  updateAdBanner,
  deleteAdBanner,
  getVideos,
  createVideo,
  updateVideo,
  deleteVideo,
} from "../../modules/marketing/marketing.controller.js";
import upload from "../../middleware/uploads/upload.middleware.js";

const router = Router();

// Ad Banners
router.get("/banners", getAdBanners);
router.post("/banners", upload.single("image"), createAdBanner);
router.put("/banners/:id", upload.single("image"), updateAdBanner);
router.delete("/banners/:id", deleteAdBanner);

// Videos
router.get("/videos", getVideos);
router.post("/videos", createVideo);
router.put("/videos/:id", updateVideo);
router.delete("/videos/:id", deleteVideo);

export default router;
