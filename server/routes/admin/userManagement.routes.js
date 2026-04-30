import express from "express";
import { getAllUsers } from "../../modules/admin/admin.controller.js"

const userManagementRouter = express.Router();

userManagementRouter.get("/all", getAllUsers);

export default userManagementRouter;
