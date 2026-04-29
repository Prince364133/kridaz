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
} from "../../controllers/admin/marketing.controller.js";

const router = Router();

// Ad Banners
router.get("/banners", getAdBanners);
router.post("/banners", createAdBanner);
router.put("/banners/:id", updateAdBanner);
router.delete("/banners/:id", deleteAdBanner);

// Videos
router.get("/videos", getVideos);
router.post("/videos", createVideo);
router.put("/videos/:id", updateVideo);
router.delete("/videos/:id", deleteVideo);

export default router;
