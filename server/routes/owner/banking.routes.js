import { Router } from "express";
import { getBankingDetails, updateBankingDetails, getPayoutConfig } from "../../modules/owner/banking.controller.js";
import verifyOwnerToken from "../../middleware/jwt/owner.middleware.js";

const bankingRouter = Router();

bankingRouter.get("/", verifyOwnerToken, getBankingDetails);
bankingRouter.put("/", verifyOwnerToken, updateBankingDetails);
bankingRouter.get("/config", verifyOwnerToken, getPayoutConfig);

export default bankingRouter;
