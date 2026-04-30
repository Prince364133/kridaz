import express from "express";
import { toggleFeatureFlag, seedFeatureFlags } from "../../modules/admin/featureFlag.controller.js";

const router = express.Router();

router.post("/seed", seedFeatureFlags);
router.put("/:key", toggleFeatureFlag);

export default router;
