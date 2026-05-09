import express from "express";
import { 
  getAllWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest
} from "../../modules/admin/admin.controller.js";

const withdrawalRouter = express.Router();

withdrawalRouter.get("/list", getAllWithdrawalRequests);
withdrawalRouter.put("/:id/approve", approveWithdrawalRequest);
withdrawalRouter.put("/:id/reject", rejectWithdrawalRequest);

export default withdrawalRouter;
