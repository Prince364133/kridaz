import { Router } from "express";
import { adminGetAllTurfs, adminApproveTurf, adminRejectTurf, adminDecommissionTurf, adminSoftDeleteTurf, adminHardDeleteTurf } from "../../modules/turf/turf.controller.js";
import verifyAdminToken from "../../middleware/jwt/admin.middleware.js";

const turfRouter = Router();

turfRouter.get("/all", verifyAdminToken, adminGetAllTurfs);
turfRouter.put("/:id/approve", verifyAdminToken, adminApproveTurf);
turfRouter.put("/:id/reject", verifyAdminToken, adminRejectTurf);
turfRouter.put("/:id/decommission", verifyAdminToken, adminDecommissionTurf);
turfRouter.put("/:id/soft-delete", verifyAdminToken, adminSoftDeleteTurf);
turfRouter.delete("/:id/hard-delete", verifyAdminToken, adminHardDeleteTurf);

export default turfRouter;