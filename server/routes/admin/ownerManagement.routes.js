import express from "express";
import { getAllOwners, getTurfByOwnerId, verifyKYC } from "../../modules/admin/admin.controller.js"

const ownerManagementRouter = express.Router();

ownerManagementRouter.get("/all", getAllOwners);
ownerManagementRouter.get("/turf/:id", getTurfByOwnerId);
ownerManagementRouter.put("/:id/kyc", verifyKYC);

export default ownerManagementRouter;