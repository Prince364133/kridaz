import express from "express";
import { 
  getAllProfessionals,
  getAllRequestedProfessionals,
  approveOwnerRequest, 
  deleteOwnerRequest, 
  reconsiderOwnerRequest 
} from "../../modules/admin/admin.controller.js"

const professionalRouter = express.Router();

professionalRouter.get("/list", getAllProfessionals);
professionalRouter.get("/requests", getAllRequestedProfessionals);

// Reuse the existing accept/delete/reconsider methods since they just update OwnerRequest status and create an Owner!
professionalRouter.put("/requests/:id/accept", approveOwnerRequest);
professionalRouter.delete("/requests/:id", deleteOwnerRequest);
professionalRouter.put("/requests/reconsider/:id", reconsiderOwnerRequest);

export default professionalRouter;
