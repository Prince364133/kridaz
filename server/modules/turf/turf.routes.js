import express from "express";
import { 
  getAllTurfs, 
  getTurfById, 
  getTimeSlotByTurfId,
  turfRegister,
  getTurfByOwner,
  editTurfById,
  getTurfDetailsWithSlots,
  adminGetAllTurfs
} from "./turf.controller.js";
import { turfRegisterSchema, turfUpdateSchema } from "./turf.validator.js";
import { validate } from "../../middleware/validate.middleware.js";
import upload from "../../middleware/uploads/upload.middleware.js";
import verifyOwnerToken from "../../middleware/jwt/owner.middleware.js";
import verifyAdminToken from "../../middleware/jwt/admin.middleware.js";

const router = express.Router();

// User routes
router.get("/user/all", getAllTurfs);
router.get("/user/details/:id", getTurfById);
router.get("/user/timeSlot", getTimeSlotByTurfId);

// Owner routes
router.post(
  "/owner/register", 
  verifyOwnerToken, 
  upload.array("images", 10), 
  validate(turfRegisterSchema), 
  turfRegister
);
router.get("/owner/all", verifyOwnerToken, getTurfByOwner);
router.get("/owner/:id/details", verifyOwnerToken, getTurfDetailsWithSlots);
router.put("/owner/:id", verifyOwnerToken, validate(turfUpdateSchema), editTurfById);

// Admin routes
router.get("/admin/all", verifyAdminToken, adminGetAllTurfs);

export default router;
