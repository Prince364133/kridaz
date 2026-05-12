import express from "express";
import { 
  getAllProfessionals,
  getAllRequestedProfessionals,
  getProfessionalDetails,
  approveOwnerRequest, 
  deleteOwnerRequest, 
  reconsiderOwnerRequest,
  deleteOwner,
  batchDeleteOwners,
  batchUpdateOwnerStatus
} from "../../modules/admin/admin.controller.js"

const professionalRouter = express.Router();

professionalRouter.get("/list", getAllProfessionals);
professionalRouter.get("/requests", getAllRequestedProfessionals);
professionalRouter.get("/:id", getProfessionalDetails);
professionalRouter.delete("/:id", deleteOwner);

// Batch actions
professionalRouter.post("/batch-delete", batchDeleteOwners);
professionalRouter.put("/batch-status", batchUpdateOwnerStatus);


// Reuse the existing accept/delete/reconsider methods since they just update OwnerRequest status and create an Owner!
professionalRouter.put("/requests/:id/accept", approveOwnerRequest);
professionalRouter.delete("/requests/:id", deleteOwnerRequest);
professionalRouter.put("/requests/reconsider/:id", reconsiderOwnerRequest);

export default professionalRouter;
