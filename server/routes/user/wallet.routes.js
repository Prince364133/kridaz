import { Router } from "express";
import {
  createTopupOrder,
  verifyTopup,
  getWalletData,
  checkPaymentStatus,
} from "../../modules/wallet/wallet.controller.js";
import verifyToken from "../../middleware/jwt/user.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createTopupSchema,
  verifyTopupSchema,
} from "../../modules/wallet/wallet.validator.js";

const walletRouter = Router();

walletRouter.get("/data", verifyToken, getWalletData);
walletRouter.get("/topup/check-status/:orderId", verifyToken, checkPaymentStatus);
walletRouter.post(
  "/topup/create-order",
  verifyToken,
  validate(createTopupSchema),
  createTopupOrder
);
walletRouter.post(
  "/topup/verify",
  verifyToken,
  validate(verifyTopupSchema),
  verifyTopup
);

export default walletRouter;
