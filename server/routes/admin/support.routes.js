import { Router } from "express";
import {
  getAllTickets,
  updateTicketStatus,
  replyToTicket,
  getAllDisputes,
  resolveDispute
} from "../../modules/admin/support.controller.js";
import verifyAdminToken from "../../middleware/jwt/admin.middleware.js";

const supportRouter = Router();

// Tickets
supportRouter.get("/tickets", verifyAdminToken, getAllTickets);
supportRouter.put("/tickets/:ticketId/status", verifyAdminToken, updateTicketStatus);
supportRouter.post("/tickets/:ticketId/reply", verifyAdminToken, replyToTicket);

// Disputes
supportRouter.get("/disputes", verifyAdminToken, getAllDisputes);
supportRouter.put("/disputes/:disputeId/resolve", verifyAdminToken, resolveDispute);

export default supportRouter;
