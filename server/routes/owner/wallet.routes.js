import { Router } from "express";
import {
  getWalletData,
  requestWithdrawal,
  getOwnerWithdrawals
} from "../../modules/wallet/wallet.controller.js";
import verifyToken from "../../middleware/jwt/user.middleware.js";

const walletRouter = Router();

walletRouter.get("/data", verifyToken, getWalletData);
walletRouter.post("/withdraw", verifyToken, requestWithdrawal);
walletRouter.get("/withdrawals", verifyToken, getOwnerWithdrawals);

export default walletRouter;
