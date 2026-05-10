import { Router } from "express";
import { raiseDispute, replyToDispute, getUserDisputes, getDisputeById } from "../../modules/dispute/dispute.controller.js";
import verifyToken from "../../middleware/jwt/user.middleware.js";

const disputeRouter = Router();

disputeRouter.post("/raise", verifyToken, raiseDispute);
disputeRouter.post("/:disputeId/reply", verifyToken, replyToDispute);
disputeRouter.get("/", verifyToken, getUserDisputes);
disputeRouter.get("/:disputeId", verifyToken, getDisputeById);

export default disputeRouter;
