import { Router } from "express";
import { createTicket, getMyTickets, addReply } from "../support.controller.js";
import verifyOwnerToken from "../../../middleware/jwt/owner.middleware.js";

const supportRouter = Router();

supportRouter.post("/create", verifyOwnerToken, createTicket);
supportRouter.get("/tickets", verifyOwnerToken, getMyTickets);
supportRouter.post("/tickets/:ticketId/reply", verifyOwnerToken, addReply);

export default supportRouter;
