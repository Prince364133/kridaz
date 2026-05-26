import { Router } from "express";
import {
  createCoupon,
  getCoupons,
  toggleCouponStatus,
  deleteCoupon,
} from "../coupon.controller.js";

const router = Router();

router.post("/", createCoupon); // Note: Should probably have validation
router.get("/", getCoupons);
router.patch("/:id/status", toggleCouponStatus);
router.delete("/:id", deleteCoupon);

export default router;
