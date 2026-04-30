import { Router } from "express";
import {
  getAllTurfs,
  getTurfById,
  getTimeSlotByTurfId,
} from "../../modules/turf/turf.controller.js";

const turfRouter = Router();

turfRouter.get("/all", getAllTurfs);
turfRouter.get("/details/:id", getTurfById);
turfRouter.get("/timeSlot", getTimeSlotByTurfId);

export default turfRouter;
