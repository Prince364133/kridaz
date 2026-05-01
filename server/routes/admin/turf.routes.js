import { Router } from "express";
import { adminGetAllTurfs, adminApproveTurf, adminRejectTurf } from "../../modules/turf/turf.controller.js";
import verifyAdminToken from "../../middleware/jwt/admin.middleware.js";

const turfRouter = Router();

turfRouter.get("/all", verifyAdminToken, adminGetAllTurfs);
turfRouter.put("/:id/approve", verifyAdminToken, adminApproveTurf);
turfRouter.put("/:id/reject", verifyAdminToken, adminRejectTurf);

export default turfRouter;