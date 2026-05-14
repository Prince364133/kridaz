import { Router } from "express";
import {
  createTeam,
  getMyTeams,
  getTeamById,
  inviteMembers,
  joinTeam,
  requestToJoin,
  getAllTeams,
  findTeamByCode,
  requestOpponent,
  handleOpponentRequest,
  getOpponentTeams
} from "./team.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/all", getAllTeams);
router.get("/find-by-code/:code", findTeamByCode);
router.get("/:id", getTeamById);

router.use(authenticate);

router.post("/:id/request-opponent", requestOpponent);
router.post("/:id/handle-opponent-request", handleOpponentRequest);
router.post("/", createTeam);
router.get("/opponents", getOpponentTeams);
router.get("/", getMyTeams);
router.post("/:id/invite", inviteMembers);
router.post("/join/:token", joinTeam); // For custom invites
router.post("/join-request/:id", requestToJoin); // Request to join a team

export default router;
