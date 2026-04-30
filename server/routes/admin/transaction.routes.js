import express from "express";
import { getAllTransactions } from "../../modules/admin/admin.controller.js"

const transactionRouter = express.Router();

transactionRouter.get("/all", getAllTransactions);

export default transactionRouter;