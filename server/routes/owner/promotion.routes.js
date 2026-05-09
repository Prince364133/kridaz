import { Router } from "express";
import { 
  createPromotion, 
  getPromotions, 
  deletePromotion,
  togglePromotionStatus
} from "../../modules/owner/promotion.controller.js";
import verifyOwnerToken from "../../middleware/jwt/owner.middleware.js";

const promotionRouter = Router();

// All routes require owner authentication
promotionRouter.use(verifyOwnerToken);

promotionRouter.post("/", createPromotion);
promotionRouter.get("/", getPromotions);
promotionRouter.delete("/:id", deletePromotion);
promotionRouter.patch("/:id/toggle", togglePromotionStatus);

export default promotionRouter;
