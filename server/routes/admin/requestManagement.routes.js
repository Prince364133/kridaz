import express from "express";
import { 
  getAllRequestedOwners, 
  approveOwnerRequest, 
  deleteOwnerRequest, 
  reconsiderOwnerRequest 
} from "../../modules/admin/admin.controller.js"

const ownerRequestRouter = express.Router();

ownerRequestRouter.get("/all", getAllRequestedOwners);
ownerRequestRouter.post("/approve/:id", approveOwnerRequest);
ownerRequestRouter.post("/reject/:id", deleteOwnerRequest);
ownerRequestRouter.post("/reconsider/:id", reconsiderOwnerRequest);

export default ownerRequestRouter;