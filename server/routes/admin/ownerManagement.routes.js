import express from "express";
import { getAllOwners, getTurfByOwnerId } from "../../modules/admin/admin.controller.js"

const ownerManagementRouter = express.Router();

ownerManagementRouter.get("/all", getAllOwners);
ownerManagementRouter.get("/turf/:id", getTurfByOwnerId);

export default ownerManagementRouter;