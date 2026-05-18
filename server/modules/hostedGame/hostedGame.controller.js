import HostedGame from "../../models/hostedGame.model.js";
import User from "../../models/user.model.js";
import Turf from "../../models/turf.model.js";
import Owner from "../../models/owner.model.js";
import WalletTransaction from "../../models/walletTransaction.model.js";
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { notifyNewGame, sendCustomPlayerInvite, sendCustomUmpireInvite } from "../../utils/notification.service.js";
import { createNotification } from "../../utils/notificationHelper.js";
import { generateShortId } from "../scoring/scoring.utils.js";
import { runInTransaction } from "../../utils/transaction.js";
import { generateUserToken } from "../../utils/generateJwtToken.js";

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
    const { city, state, sportType, query: searchTerm } = req.query;
    let query = { status: "approved", isActive: true };
    
    if (city) query.city = new RegExp(city, "i");
    if (state) query.state = new RegExp(state, "i");
    if (sportType) query.sportTypes = sportType;
    if (searchTerm) {
      query.$or = [
        { name: new RegExp(searchTerm, "i") },
        { city: new RegExp(searchTerm, "i") },
        { state: new RegExp(searchTerm, "i") }
      ];
    }

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

export const getStreamersForHosting = async (req, res) => {
  try {
    const { city, state, gameType } = req.query;
    let query = { role: "streamer" };
    
    if (city) query.city = new RegExp(city, "i");
    if (state) query.state = new RegExp(state, "i");
    if (gameType) query.gameTypes = gameType;

    const streamers = await Owner.find(query).select("name email phone profilePicture price gameTypes city state");
    return res.status(200).json({ streamers });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getScorersForHosting = async (req, res) => {
  try {
    const { city, state, gameType } = req.query;
    let query = { role: /scorer/i };
    
    if (city) query.city = new RegExp(city, "i");
    if (state) query.state = new RegExp(state, "i");
    if (gameType) query.gameTypes = gameType;

    const scorers = await Owner.find(query).select("name email phone profilePicture price gameTypes city state");
    return res.status(200).json({ scorers });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createHostedGame = async (req, res) => {
  try {
    const result = await runInTransaction(async ({ session, isTransactional }) => {
      const hostId = req.user.id || req.user.user || req.user._id;
      console.log("Creating hosted game for host:", hostId);

      const {
        gameType, date, time, groundId, umpireId, streamerId, scorerId, ground, umpire, streamer, scorer,
        perPlayerCharge, teamA, teamB, city, state,
        // Quick Game specific fields
        gameMode = "PROFESSIONAL",
        playerCount,
        quickSlotsData = [],   // [{ role, userId, customPlayer }] from frontend
        customUmpireData,      // { name, email, phone }
      } = req.body;
      
      console.log("Game Data:", { gameType, date, time, groundId, umpireId, city });

      const finalGroundId = groundId || ground?._id;
      const finalUmpireId = umpireId || umpire?._id;
      const finalStreamerId = streamerId || streamer?._id;
      const finalScorerId = scorerId || scorer?._id;

      if (!hostId) {
         throw new Error("Host ID missing. Please login again.");
      }

      // 1. Calculate Total Costs
      let groundCost = 0;
      let umpireCost = 0;
      let streamerCost = 0;
      let scorerCost = 0;

      if (finalGroundId) {
        const g = await Turf.findById(finalGroundId);
        groundCost = g?.pricePerHour || 0;
      }

      if (finalUmpireId) {
        const u = await Owner.findById(finalUmpireId);
        umpireCost = u?.price || 0;
      }
      
      if (finalStreamerId) {
        const s = await Owner.findById(finalStreamerId);
        streamerCost = s?.price || 0;
      }

      if (finalScorerId) {
        const sc = await Owner.findById(finalScorerId);
        scorerCost = sc?.price || 0;
      }

      const totalCost = groundCost + umpireCost + streamerCost + scorerCost;

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
      const isQuick = gameMode === "QUICK";

      // Build quickSlots array for Quick Game
      let builtQuickSlots = [];
      let builtCustomPlayers = [];

      if (isQuick) {
        const count = parseInt(playerCount) || quickSlotsData.length || 5;
        for (let i = 0; i < count; i++) {
          const provided = quickSlotsData[i];
          if (provided?.userId) {
            // Pre-assigned to a registered user
            builtQuickSlots.push({
              user: provided.userId,
              role: provided.role || "Player",
              status: provided.userId.toString() === hostId.toString() ? "JOINED" : "HELD",
              addedBy: hostId,
            });
          } else if (provided?.customPlayer) {
            // Off-platform invite
            const token = randomUUID();
            const cp = provided.customPlayer;
            builtCustomPlayers.push({
              name: cp.name,
              email: cp.email,
              phone: cp.phone || "",
              slotIndex: i,
              mustPay: cp.mustPay || false,
              inviteToken: token,
              inviteStatus: "PENDING",
            });
            builtQuickSlots.push({
              user: null,
              role: provided.role || "Player",
              status: "HELD",
              addedBy: hostId,
            });
          } else {
            // Open slot
            builtQuickSlots.push({ user: null, role: "Player", status: "OPEN" });
          }
        }
      }

      const hostedGame = new HostedGame({
        host: hostId,
        gameType,
        date,
        time,
        ground: finalGroundId,
        umpire: finalUmpireId,
        streamer: finalStreamerId,
        scorer: finalScorerId,
        perPlayerCharge,
        groundCost,
        umpireCost,
        streamerCost,
        totalCost,
        gameMode,
        ...(isQuick
          ? {
              quickSlots: builtQuickSlots,
              customPlayers: builtCustomPlayers,
              teams: {
                teamA: { name: "Team A", slots: [] },
                teamB: { name: "Team B", slots: [] },
              },
            }
          : {
              teams: {
                teamA: {
                  name: teamA?.name || "Team A",
                  image: sanitizeImage(teamA?.image),
                  slots: (teamA?.slots || []).map(s => ({ 
                    user: s.user || null,
                    role: s.role || "Player", 
                    status: s.status || (s.user ? "JOINED" : "OPEN") 
                  })),
                },
                teamB: {
                  name: teamB?.name || "Team B",
                  image: sanitizeImage(teamB?.image),
                  slots: (teamB?.slots || []).map(s => ({ 
                    user: s.user || null,
                    role: s.role || "Player", 
                    status: s.status || (s.user ? "JOINED" : "OPEN") 
                  })),
                },
              },
            }),
        city,
        state,
        shortId: generateShortId(),
        status: "ACTIVE",
        customUmpire: customUmpireData?.email ? {
          ...customUmpireData,
          inviteToken: randomUUID(),
          inviteStatus: "PENDING",
          invitedAt: new Date()
        } : undefined
      });

      await hostedGame.save(opts);
      return hostedGame;
    });

    // Trigger notifications (non-blocking)
    const hostId = req.user.id || req.user.user;
    let host = await User.findById(hostId).select("name email phone");
    if (!host) host = await Owner.findById(hostId).select("name email phone");

    notifyNewGame(result, host).catch(e => console.error("[Notifications] Error:", e));

    // Send invite emails to custom players (non-blocking)
    if (result.customPlayers?.length) {
      result.customPlayers.forEach(cp => {
        sendCustomPlayerInvite(cp, result, host).catch(e =>
          console.error("[CustomInvite] Error:", e)
        );
      });
    }

    // Send invite email to custom umpire (non-blocking)
    if (result.customUmpire?.email) {
      sendCustomUmpireInvite(result.customUmpire, result, host).catch(e =>
        console.error("[CustomUmpireInvite] Error:", e)
      );
    }

    return res.status(201).json({
      success: true,
      message: "Game hosted successfully!",
      game: result,
    });

  } catch (error) {
    console.error("Error in createHostedGame (Outer):", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to create game",
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

      if (game.gameMode === "QUICK") {
        if (!game.quickSlots[slotIndex]) throw new Error("Invalid slot index");
        if (game.quickSlots[slotIndex].status !== "OPEN") {
          const error = new Error("Slot already taken or pending.");
          error.status = 400;
          throw error;
        }

        game.quickSlots[slotIndex].user = userId;
        game.quickSlots[slotIndex].role = role || "Player";
        game.quickSlots[slotIndex].status = "PENDING";
        game.markModified("quickSlots");
      } else {
        const teamKey = team === "A" ? "teamA" : "teamB";
        if (!game.teams[teamKey].slots[slotIndex]) throw new Error("Invalid slot index");
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
        game.markModified(`teams.${teamKey}.slots`);
      }

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

      // Notify Host
      try {
        await createNotification({
          recipient: game.host,
          sender: userId,
          type: "GAME_JOIN_REQUEST",
          title: "New Join Request",
          message: `A player has requested to join your ${game.gameType} match.`,
          relatedId: game._id,
          onModel: "HostedGame"
        });
      } catch (notifErr) {
        console.error("Failed to send join request notification:", notifErr);
      }

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

      let playerUserId;
      if (game.gameMode === "QUICK") {
        const slot = game.quickSlots[slotIndex];
        if (!slot || slot.status !== "PENDING") throw new Error("No pending request for this slot");
        playerUserId = slot.user;
        game.quickSlots[slotIndex].status = "JOINED";
        game.markModified("quickSlots");
      } else {
        const teamKey = team === "A" ? "teamA" : "teamB";
        const slot = game.teams[teamKey].slots[slotIndex];
        if (!slot || slot.status !== "PENDING") throw new Error("No pending request for this slot");
        playerUserId = slot.user;
        game.teams[teamKey].slots[slotIndex].status = "JOINED";
        game.markModified(`teams.${teamKey}.slots`);
      }

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

      // Update player transaction to SUCCESS
      await WalletTransaction.findOneAndUpdate(
        { user: playerUserId, amount: game.perPlayerCharge, status: "RESERVED", type: "JOIN_GAME" },
        { status: "SUCCESS", description: `Joined ${game.gameType} game successfully` },
        { session, sort: { createdAt: -1 } }
      );

      // Transfer coins to Host (to offset hosting cost)
      const updatedHost = await User.findByIdAndUpdate(hostId, { 
        $inc: { walletBalance: game.perPlayerCharge } 
      }, { session });

      if (!updatedHost) {
        await Owner.findByIdAndUpdate(hostId, { 
          $inc: { walletBalance: game.perPlayerCharge } 
        }, { session });
      }

      // Add Host transaction record
      await WalletTransaction.create([{
        user: hostId,
        amount: game.perPlayerCharge,
        type: "SLOT_INCOME",
        status: "SUCCESS",
        description: `Received payment from player for slot in ${game.gameType} game`
      }], { session });

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
      .populate("streamer")
      .populate("scorer")
      .populate("umpireRequest.user", "name profilePicture")
      .populate("scorerRequest.user", "name profilePicture")
      .populate("streamerRequest.user", "name profilePicture")
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

      let playerUserId;
      if (game.gameMode === "QUICK") {
        const slot = game.quickSlots[slotIndex];
        if (!slot || slot.status !== "PENDING") throw new Error("No pending request for this slot");
        playerUserId = slot.user;
        game.quickSlots[slotIndex] = {
          user: null,
          role: "Player",
          status: "OPEN"
        };
        game.markModified("quickSlots");
      } else {
        const teamKey = team === "A" ? "teamA" : "teamB";
        const slot = game.teams[teamKey].slots[slotIndex];
        if (!slot || slot.status !== "PENDING") throw new Error("No pending request for this slot");
        playerUserId = slot.user;
        game.teams[teamKey].slots[slotIndex] = {
          user: null,
          role: "Player",
          status: "OPEN"
        };
        game.markModified(`teams.${teamKey}.slots`);
      }

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
      let allSlots = [];
      if (game.gameMode === "QUICK") {
        allSlots = game.quickSlots || [];
      } else {
        allSlots = [...(game.teams?.teamA?.slots || []), ...(game.teams?.teamB?.slots || [])];
      }
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
        { "teams.teamB.slots.user": userId },
        { "quickSlots.user": userId }
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
        game.quickSlots.forEach((s, idx) => {
          if (s.user?.toString() === userId.toString()) {
            mySlot = s;
            myTeam = "QUICK";
          }
        });
      }

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
      let isQuickSlot = false;

      // Find user's slot
      if (game.quickSlots && game.quickSlots.some((s, idx) => {
        if (s.user?.toString() === userId.toString()) {
          slotIndex = idx;
          isQuickSlot = true;
          return true;
        }
        return false;
      }));
      else if (game.teams.teamA.slots.some((s, idx) => {
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

      const slot = isQuickSlot ? game.quickSlots[slotIndex] : game.teams[teamKey].slots[slotIndex];
      
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
      if (isQuickSlot) {
        game.quickSlots[slotIndex] = {
          user: null,
          role: slot.role || "Player",
          status: "OPEN"
        };
      } else {
        game.teams[teamKey].slots[slotIndex] = {
          user: null,
          role: slot.role || "Player",
          status: "OPEN"
        };
      }

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
    const { shortId, id } = req.query;
    const queryId = shortId || id;
    if (!queryId) return res.status(400).json({ message: "Search query is required" });
    
    const searchUpper = queryId.toUpperCase().trim();

    // Build OR query: exact shortId match (case-insensitive), partial regex match, or ObjectId match
    const orClauses = [
      { shortId: new RegExp(searchUpper.replace(/[-]/g, "\\-"), "i") },
    ];
    
    // If it looks like a MongoDB ID, add to query
    if (mongoose.Types.ObjectId.isValid(queryId)) {
      orClauses.push({ _id: queryId });
    }

    const game = await HostedGame.findOne({
      $or: orClauses,
      status: { $in: ["ACTIVE", "PENDING"] }, // Don't surface cancelled games
    })
      .populate("host", "name profilePicture")
      .populate("ground", "name location images")
      .populate("umpire", "name profilePicture")
      .populate("scorer", "name profilePicture")
      .populate("streamer", "name profilePicture")
      .populate("umpireRequest.user", "name profilePicture")
      .populate("scorerRequest.user", "name profilePicture")
      .populate("streamerRequest.user", "name profilePicture");
    
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

export const requestToStreamer = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user;
    const { gameId } = req.body;

    const game = await HostedGame.findById(gameId);
    if (!game) throw new Error("Game not found");
    
    if (game.streamer) throw new Error("This game already has a streamer assigned");
    
    const owner = await Owner.findOne({ userId });
    const streamerId = owner ? owner._id : userId;

    if (game.streamerRequest?.user?.toString() === streamerId.toString() || 
        game.streamerRequest?.user?.toString() === userId.toString()) {
      throw new Error("You have already sent a request for this game");
    }

    game.streamerRequest = {
      user: streamerId,
      status: "PENDING"
    };

    await game.save();
    return res.status(200).json({ success: true, message: "Streamer request sent to host!" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const handleStreamerRequest = async (req, res) => {
  try {
    const hostId = req.user.id || req.user.user;
    const { gameId, action } = req.body;

    const game = await HostedGame.findOne({ _id: gameId, host: hostId });
    if (!game) throw new Error("Unauthorized or game not found");

    if (action === "APPROVE") {
      game.streamer = game.streamerRequest.user;
      game.streamerRequest.status = "APPROVED";
    } else {
      game.streamerRequest.status = "REJECTED";
      game.streamerRequest.user = null;
    }

    await game.save();
    return res.status(200).json({ success: true, message: `Streamer request ${action.toLowerCase()}d successfully!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const requestToScorer = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user;
    const { gameId } = req.body;

    const game = await HostedGame.findById(gameId);
    if (!game) throw new Error("Game not found");
    
    if (game.scorer) throw new Error("This game already has a scorer assigned");
    
    const owner = await Owner.findOne({ userId });
    const scorerId = owner ? owner._id : userId;

    if (game.scorerRequest?.user?.toString() === scorerId.toString() || 
        game.scorerRequest?.user?.toString() === userId.toString()) {
      throw new Error("You have already sent a request for this game");
    }

    game.scorerRequest = {
      user: scorerId,
      status: "PENDING"
    };

    await game.save();
    return res.status(200).json({ success: true, message: "Scorer request sent to host!" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const handleScorerRequest = async (req, res) => {
  try {
    const hostId = req.user.id || req.user.user;
    const { gameId, action } = req.body;

    const game = await HostedGame.findOne({ _id: gameId, host: hostId });
    if (!game) throw new Error("Unauthorized or game not found");

    if (action === "APPROVE") {
      game.scorer = game.scorerRequest.user;
      game.scorerRequest.status = "APPROVED";
    } else {
      game.scorerRequest.status = "REJECTED";
      game.scorerRequest.user = null;
    }

    await game.save();
    return res.status(200).json({ success: true, message: `Scorer request ${action.toLowerCase()}d successfully!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Host invites Scorer/Umpire directly
export const inviteOfficial = async (req, res) => {
  try {
    const hostId = req.user.id || req.user.user;
    const { gameId, officialId, type } = req.body; // type: 'UMPIRE' or 'SCORER'

    const game = await HostedGame.findOne({ _id: gameId, host: hostId });
    if (!game) throw new Error("Unauthorized or game not found");

    const official = await User.findById(officialId);
    if (!official) throw new Error("User not found");

    if (type === "UMPIRE") {
      if (game.umpire) throw new Error("Umpire already assigned");
      game.umpireRequest = { user: officialId, status: "PENDING" };
    } else if (type === "SCORER") {
      if (game.scorer) throw new Error("Scorer already assigned");
      game.scorerRequest = { user: officialId, status: "PENDING" };
    } else if (type === "STREAMER") {
      if (game.streamer) throw new Error("Streamer already assigned");
      game.streamerRequest = { user: officialId, status: "PENDING" };
    }

    await game.save();

    // Send Notification
    try {
      const { createNotification } = await import("../../utils/notificationHelper.js");
      await createNotification({
        recipientId: officialId,
        recipientModel: "User",
        title: "Match Official Invitation",
        message: `You have been invited to be a ${type} for the match: ${game.teams?.teamA?.name || 'A'} vs ${game.teams?.teamB?.name || 'B'}.`,
        type: "SYSTEM",
        link: `/my-hosted-games`,
        metadata: { gameId, type }
      });
    } catch (notifErr) {
      console.error("Invitation notification error:", notifErr);
    }

    return res.status(200).json({ success: true, message: `${type} invitation sent!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// Official (Scorer/Umpire/Streamer) responds to invitation
export const respondToOfficialInvitation = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user;
    const { gameId, type, action } = req.body; // type: 'UMPIRE', 'SCORER', 'STREAMER', action: 'APPROVE', 'REJECT'

    const game = await HostedGame.findById(gameId);
    if (!game) throw new Error("Game not found");

    if (type === "UMPIRE") {
      if (game.umpireRequest.user?.toString() !== userId.toString()) throw new Error("Unauthorized");
      if (action === "APPROVE") {
        game.umpire = userId;
        game.umpireRequest.status = "APPROVED";
        // Update user role if needed
        await User.findByIdAndUpdate(userId, { role: "umpire" });
      } else {
        game.umpireRequest.status = "REJECTED";
        game.umpireRequest.user = null;
      }
    } else if (type === "SCORER") {
      if (game.scorerRequest.user?.toString() !== userId.toString()) throw new Error("Unauthorized");
      if (action === "APPROVE") {
        game.scorer = userId;
        game.scorerRequest.status = "APPROVED";
        // Update user role to scorer
        await User.findByIdAndUpdate(userId, { role: "scorer" });
      } else {
        game.scorerRequest.status = "REJECTED";
        game.scorerRequest.user = null;
      }
    } else if (type === "STREAMER") {
      if (game.streamerRequest.user?.toString() !== userId.toString()) throw new Error("Unauthorized");
      if (action === "APPROVE") {
        game.streamer = userId;
        game.streamerRequest.status = "APPROVED";
        // Update user role to streamer
        await User.findByIdAndUpdate(userId, { role: "streamer" });
      } else {
        game.streamerRequest.status = "REJECTED";
        game.streamerRequest.user = null;
      }
    }

    await game.save();

    // ── Notify Host ──────────────────────────────────────────────────────────
    try {
      const responder = await User.findById(userId).select("name");
      const roleName = type.toLowerCase();
      const statusMsg = action === "APPROVE" ? "accepted" : "rejected";
      
      await createNotification({
        recipientId: game.host,
        recipientModel: "User",
        title: `Official Invitation ${action === "APPROVE" ? "Accepted" : "Rejected"}`,
        message: `${responder?.name || "Someone"} has ${statusMsg} your invitation to be the ${roleName} for the match on ${new Date(game.date).toDateString()}.`,
        type: "SYSTEM",
        link: `/hosted-game/${game._id}`
      });
    } catch (notifErr) {
      console.error("[Notification] Error notifying host:", notifErr);
    }

    // Generate new token to reflect role change immediately
    const updatedUser = await User.findById(userId);
    const token = generateUserToken(updatedUser._id, updatedUser.role);

    return res.status(200).json({ 
      success: true, 
      message: `Invitation ${action.toLowerCase()}d successfully!`,
      token,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        role: updatedUser.role,
        email: updatedUser.email
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateVenue = async (req, res) => {
  try {
    const hostId = req.user.id || req.user.user;
    const { gameId, groundId } = req.body;

    const game = await HostedGame.findOne({ _id: gameId, host: hostId });
    if (!game) throw new Error("Unauthorized or game not found");

    game.ground = groundId;
    await game.save();
    
    const populatedGame = await HostedGame.findById(gameId).populate("ground");
    return res.status(200).json({ success: true, message: "Venue updated successfully!", ground: populatedGame.ground });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const searchOfficials = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(200).json({ success: true, officials: [] });

    // Search in User and Owner models
    // First find matching users
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name username profilePicture city state email')
    .limit(20)
    .lean();

    // Map them for frontend
    const officials = users.map(u => ({
      _id: u._id,
      name: u.name,
      username: u.username || u.email.split('@')[0],
      profilePicture: u.profilePicture,
      location: u.city ? `${u.city}, ${u.state}` : 'Unknown'
    }));

    return res.status(200).json({ success: true, officials });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateStreamConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const config = req.body;

    const game = await HostedGame.findById(id);
    if (!game) throw new Error("Game not found");

    // Only the assigned streamer or the host should be able to update this
    const userId = req.user.id || req.user.user;
    const owner = await Owner.findOne({ userId });
    const streamerId = owner ? owner._id : userId;

    if (game.streamer?.toString() !== streamerId.toString() && game.host?.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to update stream configuration" });
    }

    game.streamConfig = {
      ...game.streamConfig,
      ...config
    };

    if (config.status) {
      game.isLive = config.status === "LIVE";
    }

    await game.save();
    return res.status(200).json({ success: true, message: "Stream configuration updated successfully!", streamConfig: game.streamConfig });
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
      .populate("scorer", "name profilePicture")
      .populate("streamer", "name profilePicture")
      .populate("teams.teamA.slots.user", "name profilePicture")
      .populate("teams.teamB.slots.user", "name profilePicture")
      .populate("umpireRequest.user", "name profilePicture")
      .populate("scorerRequest.user", "name profilePicture")
      .populate("streamerRequest.user", "name profilePicture");

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    // Official setup status for gating (Phase 3 logic)
    const officialSetupStatus = {
      hasUmpire: !!game.umpire,
      hasScorer: !!game.scorer,
      isUmpireApproved: game.umpireRequest?.status === 'APPROVED' || !!game.umpire,
      isScorerApproved: game.scorerRequest?.status === 'APPROVED' || !!game.scorer,
      streamingEnabled: (!!game.umpire || game.umpireRequest?.status === 'APPROVED') && 
                         (!!game.scorer || game.scorerRequest?.status === 'APPROVED')
    };

    return res.status(200).json({ 
      success: true, 
      game,
      officialSetupStatus 
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2B — Assign a Quick Game slot to an existing registered user (host only)
// ─────────────────────────────────────────────────────────────────────────────
export const assignQuickSlot = async (req, res) => {
  try {
    const hostId = req.user.id || req.user.user;
    const { gameId, slotIndex, userId } = req.body;

    if (slotIndex === undefined || !userId) {
      return res.status(400).json({ message: "slotIndex and userId are required" });
    }

    const game = await HostedGame.findOne({ _id: gameId, host: hostId });
    if (!game) return res.status(404).json({ message: "Game not found or unauthorized" });
    if (game.gameMode !== "QUICK") {
      return res.status(400).json({ message: "Only Quick Games support slot assignment" });
    }

    const slot = game.quickSlots[slotIndex];
    if (!slot) return res.status(400).json({ message: "Invalid slot index" });
    if (slot.status !== "OPEN") return res.status(400).json({ message: "Slot is not open" });

    game.quickSlots[slotIndex].user = userId;
    game.quickSlots[slotIndex].status = "HELD";
    game.quickSlots[slotIndex].addedBy = hostId;
    game.markModified("quickSlots");

    await game.save();
    return res.status(200).json({ success: true, message: "Slot assigned successfully" });
  } catch (error) {
    console.error("[assignQuickSlot]", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2C — Invite an off-platform custom player to a Quick Game slot
// ─────────────────────────────────────────────────────────────────────────────
export const inviteCustomPlayer = async (req, res) => {
  try {
    const hostId = req.user.id || req.user.user;
    const { gameId, slotIndex, name, email, phone, mustPay } = req.body;

    if (!email || !name || slotIndex === undefined) {
      return res.status(400).json({ message: "name, email, and slotIndex are required" });
    }

    const game = await HostedGame.findOne({ _id: gameId, host: hostId });
    if (!game) return res.status(404).json({ message: "Game not found or unauthorized" });
    if (game.gameMode !== "QUICK") {
      return res.status(400).json({ message: "Only Quick Games support custom invites" });
    }

    const slot = game.quickSlots[slotIndex];
    if (!slot) return res.status(400).json({ message: "Invalid slot index" });
    if (slot.status !== "OPEN") return res.status(400).json({ message: "Slot is not open" });

    const token = randomUUID();
    const customPlayer = {
      name,
      email,
      phone: phone || "",
      slotIndex,
      mustPay: !!mustPay,
      inviteToken: token,
      inviteStatus: "PENDING",
    };

    game.customPlayers.push(customPlayer);
    const cpDoc = game.customPlayers[game.customPlayers.length - 1];

    game.quickSlots[slotIndex].status = "HELD";
    game.quickSlots[slotIndex].addedBy = hostId;
    game.quickSlots[slotIndex].customPlayerRef = cpDoc._id;
    game.markModified("quickSlots");
    game.markModified("customPlayers");

    await game.save();

    // Fire invite email non-blocking
    const host = await User.findById(hostId).select("name email phone");
    sendCustomPlayerInvite(cpDoc, game, host).catch(e => console.error("[inviteCustomPlayer] Email Error:", e));

    return res.status(200).json({ success: true, message: "Invitation sent!" });
  } catch (error) {
    console.error("[inviteCustomPlayer]", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2D — Verify an invitation token (for the invite page)
// ─────────────────────────────────────────────────────────────────────────────
export const verifyInviteToken = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token is required" });

    // Try finding player invite first
    let game = await HostedGame.findOne({
      "customPlayers.inviteToken": token,
      "customPlayers.inviteStatus": "PENDING",
    });

    let inviteType = "PLAYER";
    let inviteData = null;

    if (game) {
      inviteData = game.customPlayers.find(p => p.inviteToken === token);
    } else {
      // Try finding umpire invite
      game = await HostedGame.findOne({
        "customUmpire.inviteToken": token,
        "customUmpire.inviteStatus": "PENDING",
      });
      if (game) {
        inviteType = "UMPIRE";
        inviteData = game.customUmpire;
      }
    }

    if (!game || !inviteData) {
      return res.status(404).json({ message: "Invite not found or already used" });
    }

    return res.status(200).json({
      success: true,
      gameId: game._id,
      shortId: game.shortId,
      inviteType,
      email: inviteData.email,
      name: inviteData.name,
      game: {
        gameType: game.gameType,
        date: game.date,
        time: game.time,
        city: game.city,
        state: game.state,
      },
    });
  } catch (error) {
    console.error("[verifyInviteToken]", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2E — Return followers + following for the slot picker popup
// ─────────────────────────────────────────────────────────────────────────────
export const getFollowersForSlot = async (req, res) => {
  try {
    const userId = req.user.id || req.user.user;

    const me = await User.findById(userId)
      .select("followers following")
      .populate("followers", "name profilePicture sportTypes city state")
      .populate("following", "name profilePicture sportTypes city state");

    if (!me) return res.status(404).json({ message: "User not found" });

    // Union of followers + following, de-duped by _id
    const seen = new Set();
    const people = [];
    [...(me.followers || []), ...(me.following || [])].forEach(u => {
      const key = u._id.toString();
      if (!seen.has(key)) {
        seen.add(key);
        people.push(u);
      }
    });

    return res.status(200).json({ success: true, people });
  } catch (error) {
    console.error("[getFollowersForSlot]", error);
    return res.status(500).json({ message: error.message });
  }
};

// -----------------------------------------------------------------------------
// Phase 2F — Claim an invited slot (called by the invited user)
// -----------------------------------------------------------------------------
export const claimInviteSlot = async (req, res) => {
  let updatedRole = null;
  let updatedOwnerId = null;

  try {
    const result = await runInTransaction(async ({ session }) => {
      const userId = req.user.id || req.user.user;
      const { token } = req.body;

      if (!token) throw new Error("Token is required");

      let game = await HostedGame.findOne({
        "customPlayers.inviteToken": token,
        "customPlayers.inviteStatus": "PENDING",
      }).session(session);

      let isUmpire = false;

      if (!game) {
        game = await HostedGame.findOne({
          "customUmpire.inviteToken": token,
          "customUmpire.inviteStatus": "PENDING",
        }).session(session);
        isUmpire = true;
      }

      if (!game) throw new Error("Invite not found or already claimed");

      if (isUmpire) {
        // Handle Umpire Claim
        game.customUmpire.inviteStatus = "ACCEPTED";
        game.customUmpire.claimedByUser = userId;
        
        // Also assign as official umpire for the match
        let owner = await Owner.findOne({ userId }).session(session);
        
        // If owner profile doesn't exist, create a LIMITED_UMPIRE owner profile
        if (!owner) {
          const userDetails = await User.findById(userId).session(session);
          if (userDetails) {
            owner = new Owner({
              userId: userId,
              name: userDetails.name || userDetails.fullName || game.customUmpire.name,
              email: userDetails.email || game.customUmpire.email,
              phone: userDetails.phone || game.customUmpire.phone,
              role: "LIMITED_UMPIRE"
            });
            await owner.save({ session });
            
            // Update User role
            userDetails.role = "LIMITED_UMPIRE";
            userDetails.ownerDetails = owner._id;
            await userDetails.save({ session });
            
            updatedRole = "LIMITED_UMPIRE";
            updatedOwnerId = owner._id;
          }
        } else if (owner.role === "venu_owners" || owner.role === "owner" || owner.role === "user") {
          // Upgrade role if they only have a basic owner profile
          owner.role = "LIMITED_UMPIRE";
          await owner.save({ session });
          await User.findByIdAndUpdate(userId, { role: "LIMITED_UMPIRE" }, { session });
          
          updatedRole = "LIMITED_UMPIRE";
          updatedOwnerId = owner._id;
        }

        game.umpire = owner ? owner._id : userId;
        
        // Remove pending requests if any
        if (game.umpireRequest) {
          game.umpireRequest.status = "APPROVED";
          game.umpireRequest.user = game.umpire;
        }

        game.markModified("customUmpire");
        game.markModified("umpireRequest");
      } else {
        // Handle Player Claim
        const cpIndex = game.customPlayers.findIndex(p => p.inviteToken === token);
        const cp = game.customPlayers[cpIndex];
        const slotIndex = cp.slotIndex;

        // Handle payment if required
        if (cp.mustPay && game.perPlayerCharge > 0) {
          const usableBalance = await getUsableBalance(userId);
          if (usableBalance < game.perPlayerCharge) {
            const error = new Error("Insufficient coins. This slot requires coins.");
            error.status = 400;
            throw error;
          }

          // Reserve coins
          const updatedPlayer = await User.findByIdAndUpdate(userId, { $inc: { reservedBalance: game.perPlayerCharge } }, { session });
          if (!updatedPlayer) {
            await Owner.findByIdAndUpdate(userId, { $inc: { reservedBalance: game.perPlayerCharge } }, { session });
          }

          await WalletTransaction.create([{
            user: userId,
            amount: game.perPlayerCharge,
            type: "JOIN_GAME",
            status: "RESERVED",
            description: "Reserved for claiming invited slot in game"
          }], { session });
        }

        // Update game state
        game.customPlayers[cpIndex].inviteStatus = "CLAIMED";
        game.customPlayers[cpIndex].claimedByUser = userId;
        
        // Update quickSlot
        if (game.gameMode === "QUICK" && game.quickSlots[slotIndex]) {
          game.quickSlots[slotIndex].user = userId;
          game.quickSlots[slotIndex].status = "JOINED";
        }

        game.markModified("customPlayers");
        game.markModified("quickSlots");
      }

      await game.save({ session });
      return { success: true, updatedRole: updatedRole || null, updatedOwnerId: updatedOwnerId || null };
    });

    if (result.updatedRole && result.updatedRole !== req.user?.role) {
      const newToken = generateUserToken(req.user.id || req.user.user, result.updatedRole, result.updatedOwnerId);
      res.cookie("auth_token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        maxAge: 30 * 24 * 60 * 60 * 1000
      });
      return res.status(200).json({ success: true, message: "Slot claimed successfully!", newToken, updatedRole: result.updatedRole });
    }

    return res.status(200).json({ success: true, message: "Slot claimed successfully!" });
  } catch (error) {
    console.error("[claimInviteSlot]", error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

export const updateTickerTheme = async (req, res) => {
  try {
    const { id } = req.params;
    const { tickerTheme } = req.body;
    const userId = req.user.id || req.user.user;

    const game = await HostedGame.findById(id);
    if (!game) throw new Error("Game not found");

    // Authorization: Only Host or assigned Streamer
    if (game.host?.toString() !== userId.toString() && game.streamer?.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to update ticker theme" });
    }

    game.tickerTheme = tickerTheme;
    await game.save();
    
    return res.status(200).json({ success: true, game });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
