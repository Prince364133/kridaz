import express from "express";
import { getAllOwners, getTurfByOwnerId, verifyKYC, deleteOwner, batchDeleteOwners, batchUpdateOwnerStatus } from "../../modules/admin/admin.controller.js"

const ownerManagementRouter = express.Router();

ownerManagementRouter.get("/all", getAllOwners);
ownerManagementRouter.get("/turf/:id", getTurfByOwnerId);
ownerManagementRouter.put("/:id/kyc", verifyKYC);
ownerManagementRouter.delete("/:id", deleteOwner);

// Batch actions
ownerManagementRouter.post("/batch-delete", batchDeleteOwners);
ownerManagementRouter.put("/batch-status", batchUpdateOwnerStatus);


export default ownerManagementRouter;