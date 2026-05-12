import express from "express";
import { getAllUsers, deleteUser, updateUserStatus, batchDeleteUsers, batchUpdateUserStatus } from "../../modules/admin/admin.controller.js"

const userManagementRouter = express.Router();

userManagementRouter.get("/all", getAllUsers);
userManagementRouter.put("/:id/status", updateUserStatus);
userManagementRouter.delete("/:id", deleteUser);

// Batch actions
userManagementRouter.post("/batch-delete", batchDeleteUsers);
userManagementRouter.put("/batch-status", batchUpdateUserStatus);


export default userManagementRouter;