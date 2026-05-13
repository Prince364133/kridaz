import express from "express";
import verifyUser from "../../middleware/jwt/user.middleware.js";
import * as controller from "./hostedGame.controller.js";

const router = express.Router();

// ── Public / Semi-public ───────────────────────────────────────────────────
router.get("/grounds", controller.getGroundsForHosting);
router.get("/umpires", controller.getUmpiresForHosting);
router.get("/streamers", controller.getStreamersForHosting);
router.get("/list", controller.getAllHostedGames);
router.get("/verify-invite", controller.verifyInviteToken); // Phase 2D — magic-link verification

// ── Authenticated — read ───────────────────────────────────────────────────
router.get("/my-hosted", verifyUser, controller.getMyHostedGames);
router.get("/search-officials", verifyUser, controller.searchOfficials);
router.get("/my-joined", verifyUser, controller.getMyJoinedGames);
router.get("/followers-for-slot", verifyUser, controller.getFollowersForSlot); // Phase 2E

// ── Authenticated — write ──────────────────────────────────────────────────
router.post("/create", verifyUser, controller.createHostedGame);
router.post("/join", verifyUser, controller.joinHostedGame);
router.post("/leave", verifyUser, controller.leaveHostedGame);
router.post("/approve", verifyUser, controller.approveJoinRequest);
router.post("/reject", verifyUser, controller.rejectJoinRequest);
router.post("/cancel", verifyUser, controller.cancelHostedGame);

// ── Quick Game slot management (Phase 2B & 2C) ─────────────────────────────
router.post("/assign-slot", verifyUser, controller.assignQuickSlot);
router.post("/invite-custom-player", verifyUser, controller.inviteCustomPlayer);
router.post("/claim-slot", verifyUser, controller.claimInviteSlot);

// ── Umpire specific ────────────────────────────────────────────────────────
router.get("/find-by-id", controller.getHostedGameByShortId);
router.get("/:id", controller.getHostedGameById);

router.post("/request-umpire", verifyUser, controller.requestToUmpire);
router.post("/handle-umpire-request", verifyUser, controller.handleUmpireRequest);

router.post("/request-streamer", verifyUser, controller.requestToStreamer);
router.post("/handle-streamer-request", verifyUser, controller.handleStreamerRequest);
router.post("/request-scorer", verifyUser, controller.requestToScorer);
router.post("/handle-scorer-request", verifyUser, controller.handleScorerRequest);
router.post("/invite-official", verifyUser, controller.inviteOfficial);
router.post("/respond-to-official-invitation", verifyUser, controller.respondToOfficialInvitation);
router.post("/:id/stream-config", verifyUser, controller.updateStreamConfig);
router.post("/update-ticker-theme/:id", verifyUser, controller.updateTickerTheme);
router.post("/update-venue", verifyUser, controller.updateVenue);

export default router;
