import { Router } from "express";
import { createTicket, getMyTickets } from "../../modules/owner/support.controller.js";
import verifyOwnerToken from "../../middleware/jwt/owner.middleware.js";

const supportRouter = Router();

supportRouter.post("/create", verifyOwnerToken, createTicket);
supportRouter.get("/tickets", verifyOwnerToken, getMyTickets);

export default supportRouter;
