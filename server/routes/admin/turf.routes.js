import { Router } from "express";
import { adminGetAllTurfs } from "../../modules/turf/turf.controller.js";
import verifyAdminToken from "../../middleware/jwt/admin.middleware.js";

const turfRouter = Router();

turfRouter.get("/all", verifyAdminToken, adminGetAllTurfs);

export default turfRouter;