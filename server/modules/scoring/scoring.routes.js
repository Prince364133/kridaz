import { Router } from "express";
import {
  searchMatch,
  startScoring,
  updateScore,
  getMatchStatus,
  completeMatch,
  getMatchAnalytics,
  goLive,
  endLive,
  updateStreamConfig,
  startNextInnings,
  // Phase 1 additions
  setToss,
  setPlayers,
  undoLastBall,
  // Phase 3: Live overlay
  getLiveScore,
} from "./scoring.controller.js";
import verifyAuth from "../../middleware/jwt/auth.middleware.js";

const router = Router();

// Public routes (anyone can see live score)
router.get("/status/:matchId", getMatchStatus);
router.get("/search/:shortId", searchMatch);
router.get("/analytics/:matchId", getMatchAnalytics);
// Phase 3: public live-score snapshot for overlay/scoreboard HTTP initial load
router.get("/live-score/:matchId", getLiveScore);

// Protected routes (Only authorized umpires can score)
router.use(verifyAuth);
router.post("/start", startScoring);
router.put("/update", updateScore);
router.post("/complete", completeMatch);
router.post("/:matchId/go-live", goLive);
router.post("/:matchId/end-live", endLive);
router.post("/:matchId/stream-config", updateStreamConfig);
router.post("/next-innings", startNextInnings);

// Phase 1: Player selection, toss, undo
router.post("/toss", setToss);
router.post("/set-players", setPlayers);
router.delete("/undo", undoLastBall);

export default router;
