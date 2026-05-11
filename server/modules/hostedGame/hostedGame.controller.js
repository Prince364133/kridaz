import HostedGame from "../../models/hostedGame.model.js";
import User from "../../models/user.model.js";
import Turf from "../../models/turf.model.js";
import Owner from "../../models/owner.model.js";
import WalletTransaction from "../../models/walletTransaction.model.js";
import mongoose from "mongoose";
import { notifyNewGame } from "../../utils/notification.service.js";
import { generateShortId } from "../scoring/scoring.utils.js";

// Helper to check usable balance
const getUsableBalance = async (userId) => {
  const [user, owner] = await Promise.all([
    User.findById(userId).select("walletBalance reservedBalance"),
    Owner.findOne({ userId }).select("walletBalance reservedBalance")
  ]);

  const uBal = (user?.walletBalance || 0) - (user?.reservedBalance || 0);
  const oBal = (owner?.walletBalance || 0) - (owner?.reservedBalance || 0);

  // Return the higher balance available to the account
  return Math.max(uBal, oBal);
};

// Helper: strip base64 images before saving to keep document size low
const sanitizeImage = (img) => {
  if (!img) return null;
  if (img.startsWith('data:')) {
    // base64 — truncate if > 200KB to avoid mongo doc limit
    return img.length > 200000 ? img.substring(0, 200000) : img;
  }
  return img; // plain URL
};

export const getGroundsForHosting = async (req, res) => {
  try {
    const { city, state, sportType } = req.query;
    let query = { status: "approved", isActive: true };
    
    if (city) query.city = new RegExp(city, "i");
    if (state) query.state = new RegExp(state, "i");
    if (sportType) query.sportTypes = sportType;

    const grounds = await Turf.find(query).select("name location city state images pricePerHour sportTypes");
    return res.status(200).json({ grounds });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUmpiresForHosting = async (req, res) => {
  try {
    const { city, state, gameType } = req.query;
    let query = { role: "umpire" };
    
    if (city) query.city = new RegExp(city, "i");
    if (state) query.state = new RegExp(state, "i");
    if (gameType) query.gameTypes = gameType;

    const umpires = await Owner.find(query).select("name email phone profilePicture price gameTypes city state");
    return res.status(200).json({ umpires });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

import { runInTransaction } from "../../utils/transaction.js";

export const createHostedGame = async (req, res) => {
  try {
    const result = await runInTransaction(async ({ session, isTransactional }) => {
      const hostId = req.user.id || req.user.user || req.user._id;
      console.log("Creating hosted game for host:", hostId);

      const { 
        gameType, date, time, groundId, umpireId, ground, umpire,
        perPlayerCharge, teamA, teamB, city, state 
      } = req.body;
      
      console.log("Game Data:", { gameType, date, time, groundId, umpireId, city });

      const finalGroundId = groundId || ground?._id;
      const finalUmpireId = umpireId || umpire?._id;

      if (!hostId) {
         throw new Error("Host ID missing. Please login again.");
      }

      // 1. Calculate Total Costs
      let groundCost = 0;
      let umpireCost = 0;

      if (finalGroundId) {
        const g = await Turf.findById(finalGroundId);
        groundCost = g?.pricePerHour || 0;
      }

      if (finalUmpireId) {
        const u = await Owner.findById(finalUmpireId);
        umpireCost = u?.price || 0;
      }

      const totalCost = groundCost + umpireCost;

      // 2. Check Balance
      const usableBalance = await getUsableBalance(hostId);
      if (usableBalance < totalCost) {
        const error = new Error(`Insufficient coins. Total cost is ${totalCost}, you have ${usableBalance}. Please top up minimum ₹500.`);
        error.status = 400;
        throw error;
      }

      console.log(`🔍 Session state in createHostedGame: isTransactional=${isTransactional}, sessionPresent=${!!session}`);
      const opts = session ? { session } : {};

      // 3. Reserve Coins
      let updatedHost = await User.findByIdAndUpdate(hostId, { $inc: { reservedBalance: totalCost } }, { ...opts, new: true });
      
      if (!updatedHost) {
        // Try Owner by _id directly (common if the host is an admin/coach logged in as Owner)
        updatedHost = await Owner.findByIdAndUpdate(hostId, { $inc: { reservedBalance: totalCost } }, { ...opts, new: true });
      }

      if (!updatedHost) {
        // Try Owner by userId (if hostId is the User ID but we need to update the professional account)
        updatedHost = await Owner.findOneAndUpdate(
          { userId: hostId }, 
          { $inc: { reservedBalance: totalCost } }, 
          { ...opts, new: true }
        );
      }

      if (!updatedHost) {
        throw new Error("Could not find host account to reserve coins.");
      }

      // 4. Create Transaction Record
      await WalletTransaction.create([{
        user: hostId,
        amount: totalCost,
        type: "HOST_GAME",
        status: "RESERVED",
        description: `Reserved for hosting ${gameType} game at ${date}`
      }], opts);

      // 5. Create Game
      const hostedGame = new HostedGame({
        host: hostId,
        gameType,
        date,
        time,
        ground: finalGroundId,
        umpire: finalUmpireId,
        perPlayerCharge,
        groundCost,
        umpireCost,
        totalCost,
        teams: {
          teamA: {
            name: teamA.name || "Team A",
            image: sanitizeImage(teamA.image),
            slots: teamA.slots.map(s => ({ role: s.role, status: "OPEN" }))
          },
          teamB: {
            name: teamB.name || "Team B",
            image: sanitizeImage(teamB.image),
            slots: teamB.slots.map(s => ({ role: s.role, status: "OPEN" }))
          }
        },
        city,
        state,
        shortId: generateShortId(),
        status: "ACTIVE"
      });

      await hostedGame.save(opts);

      return hostedGame;
    });

    // Trigger Notifications (Non-blocking)
    const hostId = req.user.id || req.user.user;
    let host = await User.findById(hostId).select("name email phone");
    if (!host) {
      host = await Owner.findById(hostId).select("name email phone");
    }
    notifyNewGame(result, host).catch(e => console.error("[Notifications] Error:", e));

    return res.status(201).json({ 
      success: true, 
      message: "Game hosted successfully. Coins reserved and local players notified!",
      game: result 
    });

  } catch (error) {
    console.error("Error in createHostedGame (Outer):", error);
    return res.status(error.status || 500).json({ 
      success: false, 
      message: error.message || "Failed to create game"
    });
  }
};

export const getAllHostedGames = async (req, res) => {
  try {
    const { city, state, gameType } = req.query;
    let query = { status: "ACTIVE" }; // Or logic to show upcoming
    
    if (city) query.city = new RegExp(city, "i");
    if (state) query.state = new RegExp(state, "i");
    if (gameType) query.gameType = gameType;

    const games = await HostedGame.find(query)
      .populate("host", "name profilePicture")
      .populate("ground", "name location images")
      .populate("umpire", "name profilePicture")
      .sort({ date: 1 });

    return res.status(200).json({ games });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const joinHostedGame = async (req, res) => {
  try {
    const result = await runInTransaction(async ({ session }) => {
      const userId = req.user.id || req.user.user;
      const { gameId, team, slotIndex, role } = req.body;

      const game = await HostedGame.findById(gameId);
      if (!game) throw new Error("Game not found");

      const usableBalance = await getUsableBalance(userId);
      if (usableBalance < game.perPlayerCharge) {
        const error = new Error("Insufficient coins to join this game.");
        error.status = 400;
        throw error;
      }

      // Update slot to PENDING
      const teamKey = team === "A" ? "teamA" : "teamB";
      if (game.teams[teamKey].slots[slotIndex].status !== "OPEN") {
        const error = new Error("Slot already taken or pending.");
        error.status = 400;
        throw error;
      }

      game.teams[teamKey].slots[slotIndex] = {
        user: userId,
        role: role,
        status: "PENDING"
      };

      // Reserve coins for player
      const updatedPlayer = await User.findByIdAndUpdate(userId, { $inc: { reservedBalance: game.perPlayerCharge } }, { session });
      if (!updatedPlayer) {
        await Owner.findByIdAndUpdate(userId, { $inc: { reservedBalance: game.perPlayerCharge } }, { session });
      }

      await WalletTransaction.create([{
        user: userId,
        amount: game.perPlayerCharge,
        type: "JOIN_GAME",
        status: "RESERVED",
        description: `Reserved for joining ${game.gameType} game`
      }], { session });

      await game.save({ session });
      return true;
    });

    return res.status(200).json({ success: true, message: "Join request sent. Coins reserved." });

  } catch (error) {
    console.error("Error in joinHostedGame:", error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

export const approveJoinRequest = async (req, res) => {
  try {
    await runInTransaction(async ({ session }) => {
      const hostId = req.user.id || req.user.user;
      const { gameId, team, slotIndex } = req.body;

      const game = await HostedGame.findOne({ _id: gameId, host: hostId });
      if (!game) throw new Error("Unauthorized or game not found");

      const teamKey = team === "A" ? "teamA" : "teamB";
      const slot = game.teams[teamKey].slots[slotIndex];
      if (slot.status !== "PENDING") throw new Error("No pending request for this slot");

      const playerUserId = slot.user;

      // Deduct coins from player
      const updatedFinalPlayer = await User.findByIdAndUpdate(playerUserId, { 
        $inc: { 
          walletBalance: -game.perPlayerCharge,
          reservedBalance: -game.perPlayerCharge 
        } 
      }, { session });
      
      if (!updatedFinalPlayer) {
        await Owner.findByIdAndUpdate(playerUserId, { 
          $inc: { 
            walletBalance: -game.perPlayerCharge,
            reservedBalance: -game.perPlayerCharge 
          } 
        }, { session });
      }

      // Update transaction to SUCCESS
      await WalletTransaction.findOneAndUpdate(
        { user: playerUserId, amount: game.perPlayerCharge, status: "RESERVED", type: "JOIN_GAME" },
        { status: "SUCCESS", description: `Joined ${game.gameType} game successfully` },
        { session, sort: { createdAt: -1 } }
      );

      // Update slot status
      game.teams[teamKey].slots[slotIndex].status = "JOINED";

      await game.save({ session });
    });

    return res.status(200).json({ success: true, message: "Player approved and coins deducted." });

  } catch (error) {
    console.error("Error in approveJoinRequest:", error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

export const getMyHostedGames = async (req, res) => {
  try {
    const hostId = req.user.id || req.user.user;
    const games = await HostedGame.find({ host: hostId })
      .populate("ground")
      .populate("umpire")
      .populate("umpireRequest.user", "name profilePicture")
      .populate("teams.teamA.slots.user", "name profilePicture")
      .populate("teams.teamB.slots.user", "name profilePicture");

    return res.status(200).json({ games });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const rejectJoinRequest = async (req, res) => {
  try {
    await runInTransaction(async ({ session }) => {
      const hostId = req.user.id || req.user.user;
      const { gameId, team, slotIndex } = req.body;

      const game = await HostedGame.findOne({ _id: gameId, host: hostId });
      if (!game) throw new Error("Unauthorized or game not found");

      const teamKey = team === "A" ? "teamA" : "teamB";
      const slot = game.teams[teamKey].slots[slotIndex];
      if (slot.status !== "PENDING") throw new Error("No pending request for this slot");

      const playerUserId = slot.user;

      // Release reserved coins for player
      const updatedPlayer = await User.findByIdAndUpdate(playerUserId, { $inc: { reservedBalance: -game.perPlayerCharge } }, { session });
      if (!updatedPlayer) {
        await Owner.findByIdAndUpdate(playerUserId, { $inc: { reservedBalance: -game.perPlayerCharge } }, { session });
      }

      // Update transaction to FAILED/REJECTED
      await WalletTransaction.findOneAndUpdate(
        { user: playerUserId, amount: game.perPlayerCharge, status: "RESERVED", type: "JOIN_GAME" },
        { status: "FAILED", description: `Join request for ${game.gameType} rejected by host` },
        { session, sort: { createdAt: -1 } }
      );

      // Reset slot to OPEN
      game.teams[teamKey].slots[slotIndex] = {
        user: null,
        role: "",
        status: "OPEN"
      };

      await game.save({ session });
    });

    return res.status(200).json({ success: true, message: "Player request rejected and coins released." });

  } catch (error) {
    console.error("Error in rejectJoinRequest:", error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

export const cancelHostedGame = async (req, res) => {
  try {
    await runInTransaction(async ({ session }) => {
      const hostId = req.user.id || req.user.user;
      const { gameId } = req.body;

      const game = await HostedGame.findOne({ _id: gameId, host: hostId });
      if (!game) throw new Error("Unauthorized or game not found");
      if (game.status === "CANCELLED") throw new Error("Game already cancelled");

      // Release host's reserved coins (if any - some platforms take hosting fee)
      // If there was a host fee reserved:
      const hostFee = 0; // Adjust if hosting costs coins
      if (hostFee > 0) {
        const updatedHost = await User.findByIdAndUpdate(hostId, { $inc: { reservedBalance: -hostFee } }, { session });
        if (!updatedHost) {
          await Owner.findByIdAndUpdate(hostId, { $inc: { reservedBalance: -hostFee } }, { session });
        }
      }

      // Release reserved coins for all PENDING players
      const allSlots = [...game.teams.teamA.slots, ...game.teams.teamB.slots];
      for (const slot of allSlots) {
        if (slot.status === "PENDING" && slot.user) {
          const updatedPlayer = await User.findByIdAndUpdate(slot.user, { $inc: { reservedBalance: -game.perPlayerCharge } }, { session });
          if (!updatedPlayer) {
            await Owner.findByIdAndUpdate(slot.user, { $inc: { reservedBalance: -game.perPlayerCharge } }, { session });
          }
          
          await WalletTransaction.create([{
            user: slot.user,
            amount: game.perPlayerCharge,
            type: "REFUND",
            status: "SUCCESS",
            description: `Refunded reserved coins due to game cancellation: ${game.gameType}`
          }], { session });
        }
      }

      game.status = "CANCELLED";
      await game.save({ session });
    });

    return res.status(200).json({ success: true, message: "Game cancelled and all reserved coins released." });

  } catch (error) {
    console.error("Error in cancelHostedGame:", error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

export const getMyJoinedGames = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user;
    
    // Find games where this user is in any slot (teamA or teamB)
    const games = await HostedGame.find({
      $or: [
        { "teams.teamA.slots.user": userId },
        { "teams.teamB.slots.user": userId }
      ]
    }).populate("host", "name profilePicture")
      .populate("ground")
      .populate("umpire");

    // Filter slots to only include current user's role and status for each game
    const gamesWithMyInfo = games.map(game => {
      let mySlot = null;
      let myTeam = "";
      
      game.teams.teamA.slots.forEach((s, idx) => {
        if (s.user?.toString() === userId.toString()) {
          mySlot = s;
          myTeam = "A";
        }
      });
      
      if (!mySlot) {
        game.teams.teamB.slots.forEach((s, idx) => {
          if (s.user?.toString() === userId.toString()) {
            mySlot = s;
            myTeam = "B";
          }
        });
      }

      return {
        ...game.toObject(),
        mySlotStatus: mySlot?.status,
        myRole: mySlot?.role,
        myTeam
      };
    });

    return res.status(200).json({ success: true, games: gamesWithMyInfo });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const leaveHostedGame = async (req, res) => {
  try {
    await runInTransaction(async ({ session }) => {
      const userId = req.user.id || req.user.user;
      const { gameId } = req.body;

      const game = await HostedGame.findById(gameId);
      if (!game) throw new Error("Game not found");

      let teamKey = "";
      let slotIndex = -1;

      // Find user's slot
      if (game.teams.teamA.slots.some((s, idx) => {
        if (s.user?.toString() === userId.toString()) {
          teamKey = "teamA";
          slotIndex = idx;
          return true;
        }
        return false;
      }));
      else if (game.teams.teamB.slots.some((s, idx) => {
        if (s.user?.toString() === userId.toString()) {
          teamKey = "teamB";
          slotIndex = idx;
          return true;
        }
        return false;
      }));

      if (slotIndex === -1) throw new Error("You are not part of this game");

      const slot = game.teams[teamKey].slots[slotIndex];
      
      // If pending, just release reserved coins
      if (slot.status === "PENDING") {
        const updatedPlayer = await User.findByIdAndUpdate(userId, { $inc: { reservedBalance: -game.perPlayerCharge } }, { session });
        if (!updatedPlayer) {
          await Owner.findByIdAndUpdate(userId, { $inc: { reservedBalance: -game.perPlayerCharge } }, { session });
        }

        await WalletTransaction.findOneAndUpdate(
          { user: userId, amount: game.perPlayerCharge, status: "RESERVED", type: "JOIN_GAME" },
          { status: "FAILED", description: `Join request for ${game.gameType} cancelled by player` },
          { session, sort: { createdAt: -1 } }
        );
      } 
      // If joined, refund coins (minus any penalty if applicable, but for now full refund)
      else if (slot.status === "JOINED") {
         // Since coins were already deducted from balance, we refund them
         const updatedPlayer = await User.findByIdAndUpdate(userId, { $inc: { walletBalance: game.perPlayerCharge } }, { session });
         if (!updatedPlayer) {
           await Owner.findByIdAndUpdate(userId, { $inc: { walletBalance: game.perPlayerCharge } }, { session });
         }

         await WalletTransaction.create([{
           user: userId,
           amount: game.perPlayerCharge,
           type: "REFUND",
           status: "SUCCESS",
           description: `Refunded coins for leaving ${game.gameType} game`
         }], { session });
      }

      // Reset slot
      game.teams[teamKey].slots[slotIndex] = {
        user: null,
        role: "",
        status: "OPEN"
      };

      await game.save({ session });
    });

    return res.status(200).json({ success: true, message: "Left game and coins updated." });

  } catch (error) {
    console.error("Error in leaveHostedGame:", error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

export const getHostedGameByShortId = async (req, res) => {
  try {
    const { shortId } = req.query;
    if (!shortId) return res.status(400).json({ message: "Search query is required" });
    
    const searchUpper = shortId.toUpperCase().trim();

    // Build OR query: exact shortId match (case-insensitive), partial regex match, or ObjectId match
    const orClauses = [
      { shortId: new RegExp(searchUpper.replace(/[-]/g, "\\-"), "i") },
    ];
    
    // If it looks like a MongoDB ID, add to query
    if (mongoose.Types.ObjectId.isValid(shortId)) {
      orClauses.push({ _id: shortId });
    }

    const game = await HostedGame.findOne({
      $or: orClauses,
      status: { $in: ["ACTIVE", "PENDING"] }, // Don't surface cancelled games
    })
      .populate("host", "name profilePicture")
      .populate("ground", "name location images")
      .populate("umpire", "name profilePicture")
      .populate("umpireRequest.user", "name profilePicture");
    
    if (!game) return res.status(404).json({ message: "Game not found" });
    
    return res.status(200).json({ success: true, game });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const requestToUmpire = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user;
    const { gameId } = req.body;

    const game = await HostedGame.findById(gameId);
    if (!game) throw new Error("Game not found");
    
    if (game.umpire) throw new Error("This game already has an umpire assigned");
    
    // Check if this user already requested (check both User ID and potential Owner ID)
    const owner = await Owner.findOne({ userId });
    const umpireId = owner ? owner._id : userId;

    if (game.umpireRequest?.user?.toString() === umpireId.toString() || 
        game.umpireRequest?.user?.toString() === userId.toString()) {
      throw new Error("You have already sent a request for this game");
    }

    game.umpireRequest = {
      user: umpireId,
      status: "PENDING"
    };

    await game.save();
    return res.status(200).json({ success: true, message: "Umpire request sent to host!" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const handleUmpireRequest = async (req, res) => {
  try {
    const hostId = req.user.id || req.user.user;
    const { gameId, action } = req.body; // action: 'APPROVE' or 'REJECT'

    const game = await HostedGame.findOne({ _id: gameId, host: hostId });
    if (!game) throw new Error("Unauthorized or game not found");

    if (action === "APPROVE") {
      game.umpire = game.umpireRequest.user;
      game.umpireRequest.status = "APPROVED";
    } else {
      game.umpireRequest.status = "REJECTED";
      game.umpireRequest.user = null;
    }

    await game.save();
    return res.status(200).json({ success: true, message: `Umpire request ${action.toLowerCase()}d successfully!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getHostedGameById = async (req, res) => {
  try {
    const { id } = req.params;
    const game = await HostedGame.findById(id)
      .populate("host", "name profilePicture")
      .populate("ground")
      .populate("umpire", "name profilePicture")
      .populate("teams.teamA.slots.user", "name profilePicture")
      .populate("teams.teamB.slots.user", "name profilePicture")
      .populate("umpireRequest.user", "name profilePicture");

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    return res.status(200).json({ success: true, game });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

