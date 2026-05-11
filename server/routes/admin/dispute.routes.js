import { Router } from "express";
import { getAllDisputes, getDisputeById, resolveDispute, replyToDispute } from "../../modules/dispute/dispute.controller.js";
import verifyAdmin from "../../middleware/jwt/admin.middleware.js";

const adminDisputeRouter = Router();

adminDisputeRouter.get("/", verifyAdmin, getAllDisputes);
adminDisputeRouter.get("/:disputeId", verifyAdmin, getDisputeById);
adminDisputeRouter.post("/:disputeId/reply", verifyAdmin, replyToDispute);
adminDisputeRouter.post("/:disputeId/resolve", verifyAdmin, resolveDispute);

export default adminDisputeRouter;
