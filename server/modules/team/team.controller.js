import crypto from "crypto";
import Team from "../../models/team.model.js";
import User from "../../models/user.model.js";
import Notification from "../../models/notification.model.js";

// @route   POST /api/v1/team
// @desc    Create a new team
export const createTeam = async (req, res) => {
  try {
    const { name, description, sportType, captainName, captainPhone } = req.body;
    
    const newTeam = new Team({
      name,
      description,
      sportType,
      captainName,
      captainPhone,
      owner: req.user._id,
      members: [{ user: req.user._id, role: "CAPTAIN", status: "JOINED" }]
    });

    await newTeam.save();
    
    return res.status(201).json({ success: true, team: newTeam, message: "Team created successfully" });
  } catch (error) {
    console.error("Create team error:", error);
    return res.status(500).json({ success: false, message: "Failed to create team" });
  }
};

// @route   GET /api/v1/team
// @desc    Get my teams
export const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [
        { owner: req.user._id },
        { "members.user": req.user._id }
      ]
    }).populate("members.user", "name username profilePicture");
    
    return res.status(200).json({ success: true, teams });
  } catch (error) {
    console.error("Get teams error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch teams" });
  }
};

// @route   GET /api/v1/team/:id
// @desc    Get team by ID
export const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("members.user", "name username profilePicture phone email")
      .populate("owner", "name username");
      
    if (!team) {
      return res.status(404).json({ success: false, message: "Team not found" });
    }
    
    return res.status(200).json({ success: true, team });
  } catch (error) {
    console.error("Get team error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch team details" });
  }
};

// @route   POST /api/v1/team/:id/invite
// @desc    Invite members to the team (existing users or custom)
export const inviteMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { invitees, inviteType } = req.body; // invitees: [{ userId } or { phone, email, name }]
    
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ success: false, message: "Team not found" });
    }
    
    // Only owner/captain can invite
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to invite" });
    }

    const results = [];

    for (let invitee of invitees) {
      if (invitee.userId) {
        // Platform user invite (followers, following, search by username)
        const user = await User.findById(invitee.userId);
        if (user) {
          // Check if already in team
          const exists = team.members.find(m => m.user?.toString() === user._id.toString());
          if (exists) {
            results.push({ user: user._id, status: "already_exists", message: "User already in team" });
            continue;
          }
          
          team.members.push({ user: user._id, role: "PLAYER", status: "PENDING" });
          
          // Send notification
          await Notification.create({
            recipient: user._id,
            type: "TEAM_INVITE",
            title: "Team Invitation",
            message: `You have been invited to join the team ${team.name}`,
            data: { teamId: team._id },
          });
          
          results.push({ user: user._id, status: "invited" });
        }
      } else {
        // Custom player / email / phone
        // First check if a user with this email or phone already exists
        const existingUser = await User.findOne({
          $or: [
            { email: invitee.email },
            { phone: invitee.phone }
          ]
        });

        if (existingUser) {
           return res.status(400).json({ 
             success: false, 
             message: `User with email/phone ${invitee.email || invitee.phone} is already registered. Please invite them directly via username.` 
           });
        }

        const inviteToken = crypto.randomUUID();
        team.customMembers.push({
          name: invitee.name,
          email: invitee.email,
          phone: invitee.phone,
          inviteToken,
          status: "PENDING"
        });
        
        // Return token so frontend can generate shareable link
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

// @route   POST /api/v1/team/join/:token
// @desc    Join team via custom invite token
export const joinTeam = async (req, res) => {
  try {
    const { token } = req.params;
    
    const team = await Team.findOne({ "customMembers.inviteToken": token });
    if (!team) {
      return res.status(404).json({ success: false, message: "Invalid or expired invite token" });
    }

    const memberIndex = team.customMembers.findIndex(m => m.inviteToken === token);
    if (memberIndex === -1) {
      return res.status(404).json({ success: false, message: "Invalid invite token" });
    }

    const customMember = team.customMembers[memberIndex];
    if (customMember.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Invite already used or expired" });
    }

    // Update status
    team.customMembers[memberIndex].status = "JOINED";
    
    // If the user is logged in (meaning they signed up and then hit the join endpoint)
    if (req.user) {
      // Check if they are already in members
      const exists = team.members.find(m => m.user?.toString() === req.user._id.toString());
      if (!exists) {
        team.members.push({ user: req.user._id, role: "PLAYER", status: "JOINED" });
      }
    }

    await team.save();

    return res.status(200).json({ success: true, message: "Successfully joined the team", team: { _id: team._id, name: team.name } });
  } catch (error) {
    console.error("Join team error:", error);
    return res.status(500).json({ success: false, message: "Failed to join team" });
  }
};
