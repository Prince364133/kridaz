import crypto from "crypto";
import Team from "../../models/team.model.js";
import User from "../../models/user.model.js";
import Notification from "../../models/notification.model.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Generates a unique 10-character alphanumeric team code (e.g. "KRZ7X2M9PQ")
 */
const generateTeamCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Ensures uniqueness of the generated team code (retry on collision)
 */
const createUniqueTeamCode = async () => {
  let code;
  let attempts = 0;
  do {
    code = generateTeamCode();
    attempts++;
    if (attempts > 10) throw new Error("Failed to generate unique team code");
  } while (await Team.exists({ teamCode: code }));
  return code;
};

// ─── Controllers ────────────────────────────────────────────────────────────

// @route   POST /api/team
// @desc    Create a new team with a unique team code
export const createTeam = async (req, res) => {
  try {
    const { name, description, sport, captainName, captainPhone } = req.body;

    const teamCode = await createUniqueTeamCode();

    const newTeam = new Team({
      name,
      description,
      sportType: sport || "CRICKET",
      captainName,
      captainPhone,
      teamCode,
      owner: req.user._id,
      members: [{ user: req.user._id, role: "CAPTAIN", status: "JOINED" }],
    });

    await newTeam.save();

    return res.status(201).json({
      success: true,
      team: newTeam,
      message: "Team created successfully",
    });
  } catch (error) {
    console.error("Create team error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create team" });
  }
};

// @route   GET /api/team
// @desc    Get my teams (owned + joined, excluding opponent-linked-only teams)
export const getMyTeams = async (req, res) => {
  try {
    const userId = req.user._id;

    const teams = await Team.find({
      $or: [{ owner: userId }, { "members.user": userId }],
    })
      .populate("members.user", "name username profilePicture")
      .populate("opponents", "name teamCode sportType members image")
      .lean();

    // Also fetch teams where this user's team is listed as an opponent
    const opponentTeamsRaw = await Team.find({
      opponents: {
        $in: teams.map((t) => t._id),
      },
    })
      .select("name teamCode sportType members image")
      .lean();

    return res.status(200).json({
      success: true,
      teams,
      opponentTeams: opponentTeamsRaw,
    });
  } catch (error) {
    console.error("Get teams error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch teams" });
  }
};

// @route   GET /api/team/all
// @desc    Get all platform teams for discovery (Players → Teams tab)
export const getAllTeams = async (req, res) => {
  try {
    const { sport, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (sport) filter.sportType = sport;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { teamCode: { $regex: search, $options: "i" } },
      ];
    }

    const teams = await Team.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .select("name teamCode sportType image members matchesPlayed totalScore")
      .populate("members.user", "name username profilePicture")
      .sort({ createdAt: -1 })
      .lean();

    const total = await Team.countDocuments(filter);

    const teamsWithStats = teams.map((team) => ({
      ...team,
      memberCount: team.members?.filter((m) => m.status === "JOINED").length || 0,
    }));

    return res.status(200).json({
      success: true,
      teams: teamsWithStats,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("Get all teams error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch teams" });
  }
};

// @route   GET /api/team/find-by-code/:code
// @desc    Find a team by its unique 10-char code (for opponent search)
export const findTeamByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const team = await Team.findOne({ teamCode: code.toUpperCase() })
      .select("name teamCode sportType image members captainName owner")
      .populate("members.user", "name username profilePicture")
      .populate("owner", "name username")
      .lean();

    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "No team found with this code. Please check the Team ID and try again." });
    }

    return res.status(200).json({ success: true, team });
  } catch (error) {
    console.error("Find team by code error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error while searching for team" });
  }
};

// @route   GET /api/team/:id
// @desc    Get team by DB ID
export const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("members.user", "name username profilePicture phone email")
      .populate("opponents", "name teamCode sportType image members")
      .populate("opponentRequests.from", "name teamCode sportType image")
      .populate("owner", "name username");

    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Team not found" });
    }

    return res.status(200).json({ success: true, team });
  } catch (error) {
    console.error("Get team error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch team details" });
  }
};

// @route   POST /api/team/:id/request-opponent
// @desc    Send a request to another team (found by teamCode) to be opponents
export const requestOpponent = async (req, res) => {
  try {
    const { id } = req.params; // my team ID
    const { targetTeamCode } = req.body;

    const myTeam = await Team.findById(id);
    if (!myTeam) {
      return res.status(404).json({ success: false, message: "Your team not found" });
    }

    // Only owner can send opponent request
    if (myTeam.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only the team owner can send opponent requests" });
    }

    const targetTeam = await Team.findOne({ teamCode: targetTeamCode.toUpperCase() });
    if (!targetTeam) {
      return res.status(404).json({ success: false, message: "Target team not found with that code" });
    }

    // Prevent requesting your own team
    if (targetTeam._id.toString() === myTeam._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot add your own team as an opponent" });
    }

    // Check if already opponents
    if (myTeam.opponents.some((o) => o.toString() === targetTeam._id.toString())) {
      return res.status(400).json({ success: false, message: "This team is already your opponent" });
    }

    // Check if request already pending
    const alreadyRequested = targetTeam.opponentRequests.some(
      (r) => r.from.toString() === myTeam._id.toString() && r.status === "PENDING"
    );
    if (alreadyRequested) {
      return res.status(400).json({ success: false, message: "Opponent request already sent" });
    }

    // Add request to target team
    targetTeam.opponentRequests.push({ from: myTeam._id, status: "PENDING" });
    await targetTeam.save();

    // Notify the owner of the target team
    await Notification.create({
      recipient: targetTeam.owner,
      type: "OPPONENT_REQUEST",
      title: "Opponent Request",
      message: `Team "${myTeam.name}" wants to be your opponent!`,
      data: { fromTeamId: myTeam._id, targetTeamId: targetTeam._id },
    });

    return res.status(200).json({
      success: true,
      message: `Opponent request sent to team "${targetTeam.name}"`,
    });
  } catch (error) {
    console.error("Request opponent error:", error);
    return res.status(500).json({ success: false, message: "Failed to send opponent request" });
  }
};

// @route   POST /api/team/:id/handle-opponent-request
// @desc    Accept or reject an incoming opponent request
export const handleOpponentRequest = async (req, res) => {
  try {
    const { id } = req.params; // my team ID
    const { fromTeamId, action } = req.body; // action: "ACCEPT" | "REJECT"

    const myTeam = await Team.findById(id);
    if (!myTeam) {
      return res.status(404).json({ success: false, message: "Team not found" });
    }

    if (myTeam.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Only the team owner can handle requests" });
    }

    const requestIndex = myTeam.opponentRequests.findIndex(
      (r) => r.from.toString() === fromTeamId && r.status === "PENDING"
    );

    if (requestIndex === -1) {
      return res.status(404).json({ success: false, message: "Opponent request not found" });
    }

    myTeam.opponentRequests[requestIndex].status = action === "ACCEPT" ? "ACCEPTED" : "REJECTED";

    if (action === "ACCEPT") {
      const fromTeam = await Team.findById(fromTeamId);
      if (!fromTeam) {
        return res.status(404).json({ success: false, message: "Requesting team not found" });
      }

      // Mutual opponent relationship
      if (!myTeam.opponents.some((o) => o.toString() === fromTeamId)) {
        myTeam.opponents.push(fromTeamId);
      }
      if (!fromTeam.opponents.some((o) => o.toString() === myTeam._id.toString())) {
        fromTeam.opponents.push(myTeam._id);
      }

      await fromTeam.save();

      // Notify requesting team owner
      await Notification.create({
        recipient: fromTeam.owner,
        type: "OPPONENT_ACCEPTED",
        title: "Opponent Request Accepted",
        message: `Team "${myTeam.name}" accepted your opponent request!`,
        data: { teamId: myTeam._id },
      });
    }

    await myTeam.save();

    return res.status(200).json({
      success: true,
      message: action === "ACCEPT" ? "Opponent added successfully" : "Request rejected",
    });
  } catch (error) {
    console.error("Handle opponent request error:", error);
    return res.status(500).json({ success: false, message: "Failed to handle request" });
  }
};

// @route   POST /api/team/:id/invite
// @desc    Invite members to the team (existing users or custom)
export const inviteMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { invitees } = req.body;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: "Team not found" });
    }

    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to invite" });
    }

    const results = [];

    for (let invitee of invitees) {
      if (invitee.userId) {
        const user = await User.findById(invitee.userId);
        if (user) {
          const exists = team.members.find(
            (m) => m.user?.toString() === user._id.toString()
          );
          if (exists) {
            results.push({ user: user._id, status: "already_exists", message: "User already in team" });
            continue;
          }

          team.members.push({ user: user._id, role: "PLAYER", status: "PENDING" });

          await Notification.create({
            recipient: user._id,
            type: "TEAM_INVITE",
            title: "Team Invitation",
            message: `You have been invited to join the team "${team.name}"`,
            data: { teamId: team._id },
          });

          results.push({ user: user._id, status: "invited" });
        }
      } else {
        const existingUser = await User.findOne({
          $or: [{ email: invitee.email }, { phone: invitee.phone }],
        });

        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: `User with email/phone ${invitee.email || invitee.phone} is already registered. Please invite them directly via username.`,
          });
        }

        const inviteToken = crypto.randomUUID();
        team.customMembers.push({
          name: invitee.name,
          email: invitee.email,
          phone: invitee.phone,
          inviteToken,
          status: "PENDING",
        });

        results.push({ name: invitee.name, token: inviteToken, status: "invited_custom" });
      }
    }

    await team.save();

    return res.status(200).json({ success: true, message: "Invites processed", results });
  } catch (error) {
    console.error("Invite error:", error);
    return res.status(500).json({ success: false, message: "Failed to process invites" });
  }
};

// @route   POST /api/team/join/:token
// @desc    Join team via custom invite token
export const joinTeam = async (req, res) => {
  try {
    const { token } = req.params;

    const team = await Team.findOne({ "customMembers.inviteToken": token });
    if (!team) {
      return res.status(404).json({ success: false, message: "Invalid or expired invite token" });
    }

    const memberIndex = team.customMembers.findIndex((m) => m.inviteToken === token);
    if (memberIndex === -1) {
      return res.status(404).json({ success: false, message: "Invalid invite token" });
    }

    const customMember = team.customMembers[memberIndex];
    if (customMember.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Invite already used or expired" });
    }

    team.customMembers[memberIndex].status = "JOINED";

    if (req.user) {
      const exists = team.members.find(
        (m) => m.user?.toString() === req.user._id.toString()
      );
      if (!exists) {
        team.members.push({ user: req.user._id, role: "PLAYER", status: "JOINED" });
      }
    }

    await team.save();

    return res.status(200).json({
      success: true,
      message: "Successfully joined the team",
      team: { _id: team._id, name: team.name },
    });
  } catch (error) {
    console.error("Join team error:", error);
    return res.status(500).json({ success: false, message: "Failed to join team" });
  }
};
