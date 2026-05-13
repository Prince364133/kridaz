import { Router } from "express";
import {
  createTeam,
  getMyTeams,
  getTeamById,
  inviteMembers,
  joinTeam,
  getAllTeams,
  findTeamByCode,
  requestOpponent,
  handleOpponentRequest,
  getOpponentTeams
} from "./team.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/all", getAllTeams);
router.get("/find-by-code/:code", findTeamByCode);
router.post("/:id/request-opponent", requestOpponent);
router.post("/:id/handle-opponent-request", handleOpponentRequest);
router.post("/", createTeam);
router.get("/opponents", getOpponentTeams);
router.get("/", getMyTeams);
router.get("/:id", getTeamById);
router.post("/:id/invite", inviteMembers);
router.post("/join/:token", joinTeam); // For custom invites

export default router;
