import { Router } from "express";
import {
  getAllTurfs,
  getTurfById,
  getTimeSlotByTurfId,
  getTurfLocations,
} from "../../modules/turf/turf.controller.js";

const turfRouter = Router();

turfRouter.get("/all", getAllTurfs);
turfRouter.get("/locations", getTurfLocations);
turfRouter.get("/details/:id", getTurfById);
turfRouter.get("/timeSlot", getTimeSlotByTurfId);

export default turfRouter;

