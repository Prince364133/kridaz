import { Router } from "express";
import {
  createTeam,
  getMyTeams,
  getTeamById,
  inviteMembers,
  joinTeam
} from "./team.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", createTeam);
router.get("/", getMyTeams);
router.get("/:id", getTeamById);
router.post("/:id/invite", inviteMembers);
router.post("/join/:token", joinTeam); // For custom invites

export default router;
