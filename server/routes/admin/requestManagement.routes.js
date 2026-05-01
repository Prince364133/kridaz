import express from "express";
import { 
  getAllRequestedOwners, 
  approveOwnerRequest, 
  deleteOwnerRequest, 
  reconsiderOwnerRequest 
} from "../../modules/admin/admin.controller.js"

const ownerRequestRouter = express.Router();

ownerRequestRouter.get("/list", getAllRequestedOwners);
ownerRequestRouter.put("/:id/accept", approveOwnerRequest);
ownerRequestRouter.delete("/:id", deleteOwnerRequest);
ownerRequestRouter.put("/reconsider/:id", reconsiderOwnerRequest);

export default ownerRequestRouter;