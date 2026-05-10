import { Router } from "express";
import { 
  searchMatch, 
  startScoring, 
  updateScore, 
  getMatchStatus,
  completeMatch,
  getMatchAnalytics
} from "./scoring.controller.js";
import verifyAuth from "../../middleware/jwt/auth.middleware.js";

const router = Router();

// Public routes (anyone can see live score)
router.get("/status/:matchId", getMatchStatus);
router.get("/search/:shortId", searchMatch);
router.get("/analytics/:matchId", getMatchAnalytics);

// Protected routes (Only authorized umpires can score)
router.use(verifyAuth);
router.post("/start", startScoring);
router.put("/update", updateScore);
router.post("/complete", completeMatch);

export default router;
