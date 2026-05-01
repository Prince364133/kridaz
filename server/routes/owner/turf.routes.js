import { Router } from "express";
import {
  turfRegister,
  getTurfByOwner,
  editTurfById,
  getTurfDetailsWithSlots,
  toggleTurfVisibility,
  deleteTurf,
} from "../../modules/turf/turf.controller.js";
import upload from "../../middleware/uploads/upload.middleware.js";
import verifyOwnerToken from "../../middleware/jwt/owner.middleware.js";
import { turfRegisterSchema } from "../../modules/turf/turf.validator.js";
import { validate } from "../../middleware/validate.middleware.js";

const turfRouter = Router();

turfRouter.post(
  "/register",
  verifyOwnerToken,
  upload.array("images", 10),
  validate(turfRegisterSchema),
  turfRegister
);

turfRouter.get("/all", verifyOwnerToken, getTurfByOwner);
turfRouter.get("/:id/details", verifyOwnerToken, getTurfDetailsWithSlots);
turfRouter.put("/:id", verifyOwnerToken, editTurfById);
turfRouter.put("/:id/visibility", verifyOwnerToken, toggleTurfVisibility);
turfRouter.delete("/:id", verifyOwnerToken, deleteTurf);

export default turfRouter;
