import express from "express";
import { 
  getAllRequestedOwners, 
  approveOwnerRequest, 
  deleteOwnerRequest, 
  reconsiderOwnerRequest,
  getAllVerificationRequests
} from "../../modules/admin/admin.controller.js"

const ownerRequestRouter = express.Router();

ownerRequestRouter.get("/list", getAllRequestedOwners);
ownerRequestRouter.get("/all", getAllVerificationRequests);
ownerRequestRouter.put("/:id/accept", approveOwnerRequest);
ownerRequestRouter.delete("/:id", deleteOwnerRequest);
ownerRequestRouter.put("/reconsider/:id", reconsiderOwnerRequest);

export default ownerRequestRouter;