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
  let user = await User.findById(userId).select("walletBalance reservedBalance");
  if (!user) {
    user = await Owner.findById(userId).select("walletBalance reservedBalance");
  }
  return (user?.walletBalance || 0) - (user?.reservedBalance || 0);
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

export const createHostedGame = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const hostId = req.user.id || req.user.user;
    const { 
      gameType, date, time, groundId, umpireId, ground, umpire,
      perPlayerCharge, teamA, teamB, city, state 
    } = req.body;

    const finalGroundId = groundId || ground?._id;
    const finalUmpireId = umpireId || umpire?._id;

    if (!hostId) {
       return res.status(401).json({ success: false, message: "Host ID missing. Please login again." });
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
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient coins. Total cost is ${totalCost}, you have ${usableBalance}. Please top up minimum ₹500.` 
      });
    }

    // Helper: strip base64 images before saving to keep document size low
    // Store only URL-based images; for base64, strip and keep a flag
    const sanitizeImage = (img) => {
      if (!img) return null;
      if (img.startsWith('data:')) {
        // base64 — store as-is (user-uploaded; truncate if > 200KB to avoid mongo doc limit)
        return img.length > 200000 ? img.substring(0, 200000) : img;
      }
      return img; // plain URL
    };

    // 3. Build game object
    const gameObj = {
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
          name: teamA?.name || "Team A",
          image: sanitizeImage(teamA?.image),
          slots: (teamA?.slots || []).map(s => ({ role: s.role, status: "OPEN" }))
        },
        teamB: {
          name: teamB?.name || "Team B",
          image: sanitizeImage(teamB?.image),
          slots: (teamB?.slots || []).map(s => ({ role: s.role, status: "OPEN" }))
        }
      },
      city,
      state,
      shortId: generateShortId(),
      status: "ACTIVE"
    };

    // 4. Try with transaction first; fall back to sessionless if replica set unavailable
    let hostedGame;
    try {
      session.startTransaction();

      if (totalCost > 0) {
        const updatedUser = await User.findByIdAndUpdate(hostId, { $inc: { reservedBalance: totalCost } }, { session });
        if (!updatedUser) {
          await Owner.findByIdAndUpdate(hostId, { $inc: { reservedBalance: totalCost } }, { session });
        }

        await WalletTransaction.create([{
          user: hostId,
          amount: totalCost,
          type: "HOST_GAME",
          status: "RESERVED",
          description: `Reserved for hosting ${gameType} game at ${date}`
        }], { session });
      }

      hostedGame = new HostedGame(gameObj);
      await hostedGame.save({ session });
      await session.commitTransaction();

    } catch (txErr) {
      // If transaction fails (e.g. standalone MongoDB), abort and retry without session
      try { await session.abortTransaction(); } catch (_) {}

      if (totalCost > 0) {
        const updatedUser = await User.findByIdAndUpdate(hostId, { $inc: { reservedBalance: totalCost } });
        if (!updatedUser) {
          await Owner.findByIdAndUpdate(hostId, { $inc: { reservedBalance: totalCost } });
        }

        await WalletTransaction.create([{
          user: hostId,
          amount: totalCost,
          type: "HOST_GAME",
          status: "RESERVED",
          description: `Reserved for hosting ${gameType} game at ${date}`
        }]);
      }

      hostedGame = new HostedGame(gameObj);
      await hostedGame.save();
    }

    // Trigger Notifications (Non-blocking)
    const host = await User.findById(hostId).select("name email phone");
    notifyNewGame(hostedGame, host).catch(e => console.error("Notification Error:", e));

    return res.status(201).json({ 
      success: true, 
      message: "Game hosted successfully. Coins reserved and local players notified!",
      game: hostedGame 
    });

  } catch (error) {
    try { await session.abortTransaction(); } catch (_) {}
    console.error("Error in createHostedGame:", error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
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
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user.id || req.user.user;
    const { gameId, team, slotIndex, role } = req.body;

    const game = await HostedGame.findById(gameId);
    if (!game) throw new Error("Game not found");

    const usableBalance = await getUsableBalance(userId);
    if (usableBalance < game.perPlayerCharge) {
      return res.status(400).json({ message: "Insufficient coins to join this game." });
    }

    // Update slot to PENDING
    const teamKey = team === "A" ? "teamA" : "teamB";
    if (game.teams[teamKey].slots[slotIndex].status !== "OPEN") {
      return res.status(400).json({ message: "Slot already taken or pending." });
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
    await session.commitTransaction();

    return res.status(200).json({ success: true, message: "Join request sent. Coins reserved." });

  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

export const approveJoinRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
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
    await session.commitTransaction();

    return res.status(200).json({ success: true, message: "Player approved and coins deducted." });

  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

export const getMyHostedGames = async (req, res) => {
  try {
    const hostId = req.user.id || req.user.user;
    const games = await HostedGame.find({ host: hostId })
      .populate("ground")
      .populate("umpire")
      .populate("teams.teamA.slots.user", "name profilePicture")
      .populate("teams.teamB.slots.user", "name profilePicture");
    return res.status(200).json({ games });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const rejectJoinRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
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
    await session.commitTransaction();

    return res.status(200).json({ success: true, message: "Player request rejected and coins released." });

  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

export const cancelHostedGame = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
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
    await session.commitTransaction();

    return res.status(200).json({ success: true, message: "Game cancelled and all reserved coins released." });

  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
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
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user.id || req.user.user;
    const { gameId } = req.body;

    const game = await HostedGame.findById(gameId);
    if (!game) throw new Error("Game not found");

    let teamKey = "";
    let slotIndex = -1;
    let slotFound = false;

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
    await session.commitTransaction();

    return res.status(200).json({ success: true, message: "Left game and coins updated." });

  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};
