import express from "express";
import verifyUser from "../../middleware/jwt/user.middleware.js";
import * as controller from "./hostedGame.controller.js";

const router = express.Router();

router.get("/grounds", controller.getGroundsForHosting);
router.get("/umpires", controller.getUmpiresForHosting);
router.get("/list", controller.getAllHostedGames);
router.get("/my-hosted", verifyUser, controller.getMyHostedGames);
router.get("/my-joined", verifyUser, controller.getMyJoinedGames);

router.post("/create", verifyUser, controller.createHostedGame);
router.post("/join", verifyUser, controller.joinHostedGame);
router.post("/leave", verifyUser, controller.leaveHostedGame);
router.post("/approve", verifyUser, controller.approveJoinRequest);
router.post("/reject", verifyUser, controller.rejectJoinRequest);
router.post("/cancel", verifyUser, controller.cancelHostedGame);

export default router;
