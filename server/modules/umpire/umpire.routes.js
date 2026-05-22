import { Router } from "express";
import { getProfile, updateProfile, getDashboardStats } from "./umpire.controller.js";
import { protect } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(protect); // Ensure all umpire routes are protected

router.route("/profile")
  .get(getProfile)
  .put(updateProfile);

router.get("/dashboard", getDashboardStats);

export default router;
