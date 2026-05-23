import { prisma } from "../../config/prisma.js";
import { randomUUID } from "crypto";
import NotificationService from "../../services/notification.service.js";
import { generateShortId } from "../scoring/scoring.utils.js";
import { runInTransaction } from "../../utils/transaction.js";
import { generateUserToken } from "../../utils/generateJwtToken.js";
import WalletService from "../../services/wallet.service.js";
import logger from "../../utils/logger.js";
import { getIO } from "../../config/socket.js";
import { liveStateService } from "../../services/liveState.service.js";

const fullGameInclude = {
  host: { select: { id: true, name: true, profilePicture: true } },
  turf: { select: { id: true, name: true, city: true, state: true, images: true } },
  umpire: { select: { id: true, name: true, profilePicture: true } },
  scorer: { select: { id: true, name: true, profilePicture: true } },
  streamer: { select: { id: true, name: true, profilePicture: true } },
  slots: { include: { user: { select: { id: true, name: true, profilePicture: true } } } },
  teams: {
    include: {
      slots: { include: { user: { select: { id: true, name: true, profilePicture: true } } } }
    }
  }
};

const formatGameForClient = (game) => {
  if (!game) return game;
  const formatted = JSON.parse(JSON.stringify(game));
  
  if (formatted.id) {
    formatted._id = formatted.id;
  }
  
  if (formatted.slots) {
    formatted.quickSlots = formatted.slots;
  }
  
  if (Array.isArray(formatted.teams)) {
    const teamA = formatted.teams.find(t => t.teamKey === 'teamA');
    const teamB = formatted.teams.find(t => t.teamKey === 'teamB');
    formatted.teams = { teamA, teamB };
  }
  
  return formatted;
};

const populateRequestUsers = async (games) => {
  if (!games || !games.length) return games;
  
  const userIds = new Set();
  games.forEach(game => {
    if (game.umpireRequest && typeof game.umpireRequest === 'object') {
      const uReq = game.umpireRequest;
      if (uReq.userId) userIds.add(uReq.userId);
    }
    if (game.scorerRequest && typeof game.scorerRequest === 'object') {
      const sReq = game.scorerRequest;
      if (sReq.userId) userIds.add(sReq.userId);
    }
    if (game.streamerRequest && typeof game.streamerRequest === 'object') {
      const stReq = game.streamerRequest;
      if (stReq.userId) userIds.add(stReq.userId);
    }
  });

  if (userIds.size === 0) return games;

  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, name: true, profilePicture: true }
  });

  const userMap = new Map(users.map(u => [u.id, u]));

  games.forEach(game => {
    if (game.umpireRequest && typeof game.umpireRequest === 'object') {
      const uReq = game.umpireRequest;
      if (uReq.userId) {
        uReq.user = userMap.get(uReq.userId) || null;
      }
    }
    if (game.scorerRequest && typeof game.scorerRequest === 'object') {
      const sReq = game.scorerRequest;
      if (sReq.userId) {
        sReq.user = userMap.get(sReq.userId) || null;
      }
    }
    if (game.streamerRequest && typeof game.streamerRequest === 'object') {
      const stReq = game.streamerRequest;
      if (stReq.userId) {
        stReq.user = userMap.get(stReq.userId) || null;
      }
    }
  });

  return games;
};

// Helper to check usable balance
const getUsableBalance = async (userId) => {
  return await WalletService.getUsableBalance(userId, 'user');
};

// Helper: strip base64 images before saving to keep document size low
const sanitizeImage = (img) => {
  if (!img) return null;
  if (img.startsWith('data:')) {
    // base64 — truncate if > 200KB to avoid extreme database payloads
    return img.length > 200000 ? img.substring(0, 200000) : img;
  }
  return img; // plain URL
};

export const getGroundsForHosting = async (req, res) => {
  try {
    const { city, state, sportType, query: searchTerm } = req.query;
    
    const grounds = await prisma.turf.findMany({
      where: {
        status: "approved",
        isActive: true,
        ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
        ...(state ? { state: { contains: state, mode: 'insensitive' } } : {}),
        ...(sportType ? { sportTypes: { has: sportType } } : {}), // PostgreSQL/Prisma array handling
        ...(searchTerm ? {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { city: { contains: searchTerm, mode: 'insensitive' } },
            { state: { contains: searchTerm, mode: 'insensitive' } }
          ]
        } : {})
      },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        images: true,
        pricePerHour: true,
        sportTypes: true
      }
    });

    return res.status(200).json({ grounds });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUmpiresForHosting = async (req, res) => {
  try {
    const { city, state, gameType, query: searchTerm } = req.query;
    
    const umpires = await prisma.ownerProfile.findMany({
      where: {
        user: {
          role: "UMPIRE",
          ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
          ...(state ? { state: { contains: state, mode: 'insensitive' } } : {}),
          ...(searchTerm ? {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { phone: { contains: searchTerm, mode: 'insensitive' } }
            ]
          } : {})
        }
      },
      select: {
        id: true,
        price: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            profilePicture: true,
            city: true,
            state: true,
            sportTypes: true
          }
        }
      }
    });

    const formattedUmpires = umpires.map(u => ({
      id: u.id,
      price: u.price,
      gameTypes: u.user.sportTypes || [],
      name: u.user.name,
      email: u.user.email,
      phone: u.user.phone,
      profilePicture: u.user.profilePicture,
      city: u.user.city,
      state: u.user.state
    }));

    return res.status(200).json({ umpires: formattedUmpires });
  } catch (error) {
    logger.error("getUmpiresForHosting error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const getStreamersForHosting = async (req, res) => {
  try {
    const { city, state, gameType, query: searchTerm } = req.query;
    
    const streamers = await prisma.ownerProfile.findMany({
      where: {
        user: {
          role: "STREAMER",
          ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
          ...(state ? { state: { contains: state, mode: 'insensitive' } } : {}),
          ...(searchTerm ? {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { phone: { contains: searchTerm, mode: 'insensitive' } }
            ]
          } : {})
        }
      },
      select: {
        id: true,
        price: true,
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            profilePicture: true,
            city: true,
            state: true,
            sportTypes: true
          }
        }
      }
    });

    const formattedStreamers = streamers.map(s => ({
      id: s.id,
      price: s.price,
      gameTypes: s.user.sportTypes || [],
      name: s.user.name,
      email: s.user.email,
      phone: s.user.phone,
      profilePicture: s.user.profilePicture,
      city: s.user.city,
      state: s.user.state
    }));

    return res.status(200).json({ streamers: formattedStreamers });
  } catch (error) {
    logger.error("getStreamersForHosting error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const createHostedGame = async (req, res) => {
  try {
    const result = await runInTransaction(async ({ tx }) => {
      const hostId = req.user.id;
      logger.info("Creating hosted game for host:", hostId);

      const {
        gameType, date, time, groundId, umpireId, streamerId, ground, umpire, streamer,
        perPlayerCharge, teamA, teamB, city, state,
        // Quick Game specific fields
        gameMode = "PROFESSIONAL",
        playerCount,
        quickSlotsData = [],   // [{ role, userId, customPlayer }] from frontend
        customUmpireData,      // { name, email, phone }
      } = req.body;
      
      logger.info("Game Data:", { gameType, date, time, groundId, umpireId, city });

      const finalGroundId = groundId || ground?.id;
      const finalUmpireId = umpireId || umpire?.id;
      const finalStreamerId = streamerId || streamer?.id;

      if (!hostId) {
         throw new Error("Host ID missing. Please login again.");
      }

      // 1. Calculate Total Costs
      let groundCost = 0;
      let umpireCost = 0;
      let streamerCost = 0;

      if (finalGroundId) {
        const g = await tx.turf.findUnique({ where: { id: finalGroundId } });
        groundCost = Number(g?.pricePerHour || 0);
      }

      if (finalUmpireId) {
        const u = await tx.ownerProfile.findUnique({ where: { id: finalUmpireId } });
        umpireCost = Number(u?.price || 0);
      }
      
      if (finalStreamerId) {
        const s = await tx.ownerProfile.findUnique({ where: { id: finalStreamerId } });
        streamerCost = Number(s?.price || 0);
      }

      const totalCost = groundCost + umpireCost + streamerCost;

      // 2. Check Balance
      const usableBalance = await WalletService.getUsableBalance(hostId, 'user', tx);
      if (usableBalance < totalCost) {
        const error = new Error(`Insufficient coins. Total cost is ${totalCost}, you have ${usableBalance}. Please top up minimum ₹500.`);
        error.status = 400;
        throw error;
      }

      // 3. Reserve Coins
      await WalletService.reserve(hostId, 'user', totalCost, tx);

      // 4. Create Transaction Record
      await tx.walletTransaction.create({
        data: {
          userId: hostId,
          amount: totalCost,
          type: "HOST_GAME",
          status: "RESERVED",
          description: `Reserved for hosting ${gameType} game at ${date}`
        }
      });

      // 5. Create Game
      const isQuick = gameMode === "QUICK";

      const hostedGame = await tx.hostedGame.create({
        data: {
          hostId,
          gameType,
          date: new Date(date),
          time,
          turfId: finalGroundId,
          umpireId: finalUmpireId,
          streamerId: finalStreamerId,
          perPlayerCharge,
          groundCost,
          umpireCost,
          streamerCost,
          totalCost,
          gameMode,
          city,
          state,
          shortId: generateShortId(),
          status: "ACTIVE",
          customUmpire: customUmpireData?.email ? {
            ...customUmpireData,
            inviteToken: randomUUID(),
            inviteStatus: "PENDING",
            invitedAt: new Date().toISOString()
          } : undefined
        }
      });

      // 6. Create Teams & Slots
      if (isQuick) {
        // QUICK Mode: Flat slots
        const count = parseInt(playerCount) || quickSlotsData.length || 5;
        
        for (let i = 0; i < count; i++) {
          const provided = quickSlotsData[i];
          let customPlayerId = null;
          let slotStatus = "OPEN";
          let userId = null;

          if (provided?.userId) {
            userId = provided.userId;
            slotStatus = userId.toString() === hostId.toString() ? "JOINED" : "HELD";
          } else if (provided?.customPlayer) {
            const token = randomUUID();
            const cp = provided.customPlayer;
            const invite = await tx.customPlayerInvite.create({
              data: {
                gameId: hostedGame.id,
                name: cp.name,
                email: cp.email,
                phone: cp.phone || "",
                mustPay: cp.mustPay || false,
                inviteToken: token,
                inviteStatus: "PENDING"
              }
            });
            customPlayerId = invite.id;
            slotStatus = "HELD";
          }

          await tx.gameSlot.create({
            data: {
              gameId: hostedGame.id,
              userId,
              customPlayerId,
              role: provided?.role || "Player",
              status: slotStatus,
              addedById: hostId
            }
          });
        }
      } else {
        // PROFESSIONAL Mode: Team A vs Team B
        const teams = [
          { key: "teamA", data: teamA, defaultName: "Team A" },
          { key: "teamB", data: teamB, defaultName: "Team B" }
        ];

        for (const t of teams) {
          const createdTeam = await tx.gameTeam.create({
            data: {
              gameId: hostedGame.id,
              name: t.data?.name || t.defaultName,
              teamKey: t.key,
              image: sanitizeImage(t.data?.image)
            }
          });

          const slots = t.data?.slots || [];
          for (const s of slots) {
            await tx.gameSlot.create({
              data: {
                gameId: hostedGame.id,
                teamId: createdTeam.id,
                userId: s.user || null,
                role: s.role || "Player",
                status: s.status || (s.user ? "JOINED" : "OPEN"),
                addedById: hostId
              }
            });
          }
        }
      }

      // Fetch the full game object with relations for the response/notifications
      return await tx.hostedGame.findUnique({
        where: { id: hostedGame.id },
        include: {
          teams: { include: { slots: true } },
          slots: true,
          invites: true
        }
      });
    });

    // Trigger notifications (non-blocking)
    const hostId = req.user.id || req.user.user;
    let host = await prisma.user.findUnique({ where: { id: hostId }, select: { name: true, email: true, phone: true } });
    if (!host) host = await prisma.ownerProfile.findFirst({ where: { OR: [{ id: hostId }, { userId: hostId }] }, select: { name: true, email: true, phone: true } });
    
    NotificationService.notifyNewGame({ game: result, host });

    // Send invite emails to custom players (Queued)
    if (result.invites?.length) {
      result.invites.forEach(cp => {
        NotificationService.sendCustomPlayerInvite({ customPlayer: cp, game: result, host });
      });
    }

    // Send invite email to custom umpire (Queued)
    if (result.customUmpire && typeof result.customUmpire === 'object' && result.customUmpire.email) {
      NotificationService.sendCustomUmpireInvite({ customUmpire: result.customUmpire, game: result, host });
    }

    return res.status(201).json({
      success: true,
      message: "Game hosted successfully!",
      game: formatGameForClient(result),
    });

  } catch (error) {
    logger.error("Error in createHostedGame (Outer):", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to create game",
    });
  }
};

export const getAllHostedGames = async (req, res) => {
  try {
    const { city, state, gameType } = req.query;
    
    const games = await prisma.hostedGame.findMany({
      where: {
        status: "ACTIVE",
        ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
        ...(state ? { state: { contains: state, mode: 'insensitive' } } : {}),
        ...(gameType ? { gameType } : {})
      },
      orderBy: { date: 'asc' },
      include: fullGameInclude
    });

    const formattedGames = games.map(formatGameForClient);

    return res.status(200).json({ games: formattedGames });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const joinHostedGame = async (req, res) => {
  try {
    await runInTransaction(async ({ tx }) => {
      const userId = req.user.id;
      const { gameId, team, slotIndex, role, slotId } = req.body;

      const game = await tx.hostedGame.findUnique({
        where: { id: gameId },
        include: {
          slots: { orderBy: { createdAt: 'asc' } },
          teams: { include: { slots: { orderBy: { createdAt: 'asc' } } } }
        }
      });
      if (!game) throw new Error("Game not found");

      const perPlayerCharge = Number(game.perPlayerCharge || 0);
      const usableBalance = await WalletService.getUsableBalance(userId, 'user', tx);
      if (usableBalance < perPlayerCharge) {
        const error = new Error("Insufficient coins to join this game.");
        error.status = 400;
        throw error;
      }

      let targetSlot;
      if (slotId) {
        targetSlot = await tx.gameSlot.findUnique({ where: { id: slotId } });
      } else if (game.gameMode === "QUICK") {
        targetSlot = game.slots[slotIndex];
      } else {
        const teamKey = team === "A" ? "teamA" : "teamB";
        const targetTeam = game.teams.find(t => t.teamKey === teamKey);
        if (!targetTeam) throw new Error("Team not found");
        targetSlot = targetTeam.slots[slotIndex];
      }

      if (!targetSlot) throw new Error("Slot not found");
      if (targetSlot.status !== "OPEN") {
        const error = new Error("Slot already taken or pending.");
        error.status = 400;
        throw error;
      }

      // Reserve coins for player
      await WalletService.reserve(userId, 'user', perPlayerCharge, tx);

      await tx.walletTransaction.create({
        data: {
          userId,
          amount: perPlayerCharge,
          type: "JOIN_GAME",
          status: "RESERVED",
          description: `Reserved for joining ${game.gameType} game`
        }
      });

      await tx.gameSlot.update({
        where: { id: targetSlot.id },
        data: {
          userId,
          role: role || "Player",
          status: "PENDING"
        }
      });

      NotificationService.sendInApp({
        recipientId: game.hostId,
        senderId: userId,
        type: "GAME_JOIN_REQUEST",
        title: "New Join Request",
        message: `A player has requested to join your ${game.gameType} match.`,
        relatedId: game.id,
        onModel: "HostedGame"
      });

      return true;
    });

    return res.status(200).json({ success: true, message: "Join request sent. Coins reserved." });

  } catch (error) {
    logger.error("Error in joinHostedGame:", error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

export const approveJoinRequest = async (req, res) => {
  try {
    await runInTransaction(async ({ tx }) => {
      const hostId = req.user.id || req.user.user;
      const { gameId, team, slotIndex, slotId } = req.body;

      const game = await tx.hostedGame.findUnique({
        where: { id: gameId },
        include: {
          slots: { orderBy: { createdAt: 'asc' } },
          teams: { include: { slots: { orderBy: { createdAt: 'asc' } } } }
        }
      });
      if (!game || game.hostId !== hostId) throw new Error("Unauthorized or game not found");

      let targetSlot;
      if (slotId) {
        targetSlot = await tx.gameSlot.findUnique({ where: { id: slotId } });
      } else if (game.gameMode === "QUICK") {
        targetSlot = game.slots[slotIndex];
      } else {
        const teamKey = (team === "A" || team === "teamA") ? "teamA" : "teamB";
        const targetTeam = game.teams.find(t => t.teamKey === teamKey);
        if (!targetTeam) throw new Error("Team not found");
        targetSlot = targetTeam.slots[slotIndex];
      }

      if (!targetSlot || targetSlot.status !== "PENDING") throw new Error("No pending request for this slot");
      
      const playerUserId = targetSlot.userId;
      const perPlayerCharge = Number(game.perPlayerCharge || 0);

      // Deduct coins from player (Release reserved + Debit)
      await WalletService.release(playerUserId, 'user', perPlayerCharge, true, tx);

      // Update player transaction to SUCCESS
      const latestReservedTx = await tx.walletTransaction.findFirst({
        where: { userId: playerUserId, amount: perPlayerCharge, status: "RESERVED", type: "JOIN_GAME" },
        orderBy: { createdAt: 'desc' }
      });
      
      if (latestReservedTx) {
        await tx.walletTransaction.update({
          where: { id: latestReservedTx.id },
          data: { status: "SUCCESS", description: `Joined ${game.gameType} game successfully` }
        });
      }

      // Transfer coins to Host (to offset hosting cost)
      await WalletService.credit(hostId, 'user', perPlayerCharge, tx);

      // Add Host transaction record
      await tx.walletTransaction.create({
        data: {
          userId: hostId,
          amount: perPlayerCharge,
          type: "SLOT_INCOME",
          status: "SUCCESS",
          description: `Received payment from player for slot in ${game.gameType} game`
        }
      });

      await tx.gameSlot.update({
        where: { id: targetSlot.id },
        data: { status: "JOINED" }
      });
    });

    return res.status(200).json({ success: true, message: "Player approved and coins deducted." });

  } catch (error) {
    logger.error("Error in approveJoinRequest:", error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

// Redundant block removed
export const getMyHostedGames = async (req, res) => {
  try {
    const hostId = req.user.id || req.user.user;
    let games = await prisma.hostedGame.findMany({
      where: { hostId },
      orderBy: { date: 'desc' },
      include: fullGameInclude
    });

    games = await populateRequestUsers(games);
    const formattedGames = games.map(formatGameForClient);

    return res.status(200).json({ games: formattedGames });
  } catch (error) {
    logger.error("Error in getMyHostedGames:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const rejectJoinRequest = async (req, res) => {
  try {
    await runInTransaction(async ({ tx }) => {
      const hostId = req.user.id || req.user.user;
      const { gameId, team, slotIndex, slotId } = req.body;

      const game = await tx.hostedGame.findUnique({
        where: { id: gameId },
        include: {
          slots: { orderBy: { createdAt: 'asc' } },
          teams: { include: { slots: { orderBy: { createdAt: 'asc' } } } }
        }
      });
      if (!game || game.hostId !== hostId) throw new Error("Unauthorized or game not found");

      let targetSlot;
      if (slotId) {
        targetSlot = await tx.gameSlot.findUnique({ where: { id: slotId } });
      } else if (game.gameMode === "QUICK") {
        targetSlot = game.slots[slotIndex];
      } else {
        const teamKey = (team === "A" || team === "teamA") ? "teamA" : "teamB";
        const targetTeam = game.teams.find(t => t.teamKey === teamKey);
        if (!targetTeam) throw new Error("Team not found");
        targetSlot = targetTeam.slots[slotIndex];
      }

      if (!targetSlot || targetSlot.status !== "PENDING") throw new Error("No pending request for this slot");
      
      const playerUserId = targetSlot.userId;
      const perPlayerCharge = Number(game.perPlayerCharge || 0);

      // Release reserved coins for player
      await WalletService.release(playerUserId, 'user', perPlayerCharge, false, tx);

      // Update transaction to FAILED/REJECTED
      const latestReservedTx = await tx.walletTransaction.findFirst({
        where: { userId: playerUserId, amount: perPlayerCharge, status: "RESERVED", type: "JOIN_GAME" },
        orderBy: { createdAt: 'desc' }
      });

      if (latestReservedTx) {
        await tx.walletTransaction.update({
          where: { id: latestReservedTx.id },
          data: { status: "FAILED", description: `Join request for ${game.gameType} rejected by host` }
        });
      }

      await tx.gameSlot.update({
        where: { id: targetSlot.id },
        data: {
          userId: null,
          role: "Player",
          status: "OPEN"
        }
      });
    });

    return res.status(200).json({ success: true, message: "Player request rejected and coins released." });

  } catch (error) {
    logger.error("Error in rejectJoinRequest:", error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

export const cancelHostedGame = async (req, res) => {
  try {
    await runInTransaction(async ({ tx }) => {
      const hostId = req.user.id || req.user.user;
      const { gameId } = req.body;

      const game = await tx.hostedGame.findUnique({
        where: { id: gameId },
        include: {
          slots: true,
          teams: { include: { slots: true } }
        }
      });
      if (!game || game.hostId !== hostId) throw new Error("Unauthorized or game not found");
      if (game.status === "CANCELLED") throw new Error("Game already cancelled");

      // Release host's reserved coins (if any)
      // Note: We'd need to know if hosting costs coins. Assuming 0 for now as per legacy code.

      // Release reserved coins for all PENDING players
      let allSlots = [];
      if (game.gameMode === "QUICK") {
        allSlots = game.slots || [];
      } else {
        game.teams.forEach(t => {
          allSlots = [...allSlots, ...(t.slots || [])];
        });
      }

      const pendingSlots = allSlots.filter(slot => slot.status === "PENDING" && slot.userId);
      const joinedSlots = allSlots.filter(slot => slot.status === "JOINED" && slot.userId);
      const perPlayerCharge = Number(game.perPlayerCharge || 0);

      for (const slot of pendingSlots) {
        await WalletService.release(slot.userId, 'user', perPlayerCharge, false, tx);
        await tx.walletTransaction.create({
          data: {
            userId: slot.userId,
            amount: perPlayerCharge,
            type: "REFUND",
            status: "SUCCESS",
            description: `Refunded reserved coins due to game cancellation: ${game.gameType}`
          }
        });
      }

      for (const slot of joinedSlots) {
        // Debit host (refund from host's balance)
        await WalletService.debit(hostId, 'user', perPlayerCharge, tx);
        await tx.walletTransaction.create({
          data: {
            userId: hostId,
            amount: perPlayerCharge,
            type: "REFUND_DEBIT",
            status: "SUCCESS",
            description: `Deducted slot payment for game cancellation: ${game.gameType}`
          }
        });

        // Credit player
        await WalletService.credit(slot.userId, 'user', perPlayerCharge, tx);
        await tx.walletTransaction.create({
          data: {
            userId: slot.userId,
            amount: perPlayerCharge,
            type: "REFUND",
            status: "SUCCESS",
            description: `Refunded slot payment due to game cancellation: ${game.gameType}`
          }
        });
      }

      await tx.hostedGame.update({
        where: { id: gameId },
        data: { status: "CANCELLED" }
      });
    });

    return res.status(200).json({ success: true, message: "Game cancelled and all reserved coins released." });

  } catch (error) {
    logger.error("Error in cancelHostedGame:", error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

export const getMyJoinedGames = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find games where this user has a slot
    const slots = await prisma.gameSlot.findMany({
      where: { userId },
      include: {
        game: {
          include: fullGameInclude
        }
      },
      orderBy: { game: { date: 'desc' } }
    });

    const gamesWithMyInfo = slots.map(slot => {
      const game = formatGameForClient(slot.game);
      return {
        ...game,
        mySlotStatus: slot.status,
        myRole: slot.role,
        myTeam: slot.teamId // In the new schema, teamId represents the team
      };
    });

    return res.status(200).json({ success: true, games: gamesWithMyInfo });
  } catch (error) {
    logger.error("Error in getMyJoinedGames:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const leaveHostedGame = async (req, res) => {
  try {
    await runInTransaction(async ({ tx }) => {
      const userId = req.user.id;
      const { gameId } = req.body;

      const userSlot = await tx.gameSlot.findFirst({
        where: { gameId, userId },
        include: { game: true }
      });

      if (!userSlot) throw new Error("You are not part of this game");

      const game = userSlot.game;
      const perPlayerCharge = Number(game.perPlayerCharge || 0);

      // If pending, just release reserved coins
      if (userSlot.status === "PENDING") {
        await WalletService.release(userId, 'user', perPlayerCharge, false, tx);

        const latestReservedTx = await tx.walletTransaction.findFirst({
          where: { userId, amount: perPlayerCharge, status: "RESERVED", type: "JOIN_GAME" },
          orderBy: { createdAt: 'desc' }
        });

        if (latestReservedTx) {
          await tx.walletTransaction.update({
            where: { id: latestReservedTx.id },
            data: { status: "FAILED", description: `Join request for ${game.gameType} cancelled by player` }
          });
        }
      } 
      // If joined, refund coins
      else if (userSlot.status === "JOINED") {
        const hostId = game.hostId;

        // Debit host (refund from host's balance)
        await WalletService.debit(hostId, 'user', perPlayerCharge, tx);
        await tx.walletTransaction.create({
          data: {
            userId: hostId,
            amount: perPlayerCharge,
            type: "REFUND_DEBIT",
            status: "SUCCESS",
            description: `Deducted slot payment because player left game: ${game.gameType}`
          }
        });

        // Credit player
        await WalletService.credit(userId, 'user', perPlayerCharge, tx);
        await tx.walletTransaction.create({
          data: {
            userId,
            amount: perPlayerCharge,
            type: "REFUND",
            status: "SUCCESS",
            description: `Refunded coins for leaving ${game.gameType} game`
          }
        });
      }

      // Reset slot
      await tx.gameSlot.update({
        where: { id: userSlot.id },
        data: {
          userId: null,
          status: "OPEN"
        }
      });
    });

    return res.status(200).json({ success: true, message: "Left game and coins processed." });
  } catch (error) {
    logger.error("Error in leaveHostedGame:", error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

export const getHostedGameByShortId = async (req, res) => {
  try {
    const { shortId, id } = req.query;
    const queryId = shortId || id;
    if (!queryId) return res.status(400).json({ message: "Search query is required" });
    
    const searchUpper = queryId.toUpperCase().trim();

    const orClauses = [
      { shortId: { contains: searchUpper, mode: 'insensitive' } }
    ];
    
    if (queryId.length === 24 || queryId.length === 36) { // Basic check for ID strings
      orClauses.push({ id: queryId });
    }

    const game = await prisma.hostedGame.findFirst({
      where: {
        OR: orClauses,
        status: { in: ["ACTIVE", "PENDING"] }
      },
      include: fullGameInclude
    });
    
    if (!game) return res.status(404).json({ message: "Game not found" });
    await populateRequestUsers([game]);
    
    return res.status(200).json({ success: true, game: formatGameForClient(game) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const requestToUmpire = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameId } = req.body;

    const game = await prisma.hostedGame.findUnique({
      where: { id: gameId }
    });
    if (!game) throw new Error("Game not found");
    
    if (game.umpireId) throw new Error("This game already has an umpire assigned");
    
    const owner = await prisma.ownerProfile.findFirst({ where: { userId } });
    const umpireId = owner ? owner.id : userId;

    if (game.umpireRequest?.userId === umpireId || game.umpireRequest?.userId === userId) {
      throw new Error("You have already sent a request for this game");
    }

    await prisma.hostedGame.update({
      where: { id: gameId },
      data: {
        umpireRequest: { userId: umpireId, status: "PENDING" }
      }
    });

    return res.status(200).json({ success: true, message: "Umpire request sent to host!" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const handleUmpireRequest = async (req, res) => {
  try {
    const hostId = req.user.id || req.user.user;
    const { gameId, action } = req.body; // action: 'APPROVE' or 'REJECT'

    const game = await prisma.hostedGame.findFirst({
      where: { id: gameId, hostId }
    });
    if (!game) throw new Error("Unauthorized or game not found");

    if (action === "APPROVE") {
      const currentRequest = game.umpireRequest || {};
      const updatedRequest = { ...currentRequest, status: "APPROVED" };
      await prisma.hostedGame.update({
        where: { id: gameId },
        data: {
          umpireId: game.umpireRequest.userId,
          umpireRequest: updatedRequest
        }
      });
    } else {
      const currentRequest = game.umpireRequest || {};
      const updatedRequest = { ...currentRequest, status: "REJECTED", userId: null };
      await prisma.hostedGame.update({
        where: { id: gameId },
        data: {
          umpireRequest: updatedRequest
        }
      });
    }

    return res.status(200).json({ success: true, message: `Umpire request ${action.toLowerCase()}d successfully!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const requestToStreamer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameId } = req.body;

    const game = await prisma.hostedGame.findUnique({
      where: { id: gameId }
    });
    if (!game) throw new Error("Game not found");
    
    if (game.streamerId) throw new Error("This game already has a streamer assigned");
    
    const owner = await prisma.ownerProfile.findFirst({ where: { userId } });
    const streamerId = owner ? owner.id : userId;

    if (game.streamerRequest?.userId === streamerId || game.streamerRequest?.userId === userId) {
      throw new Error("You have already sent a request for this game");
    }

    await prisma.hostedGame.update({
      where: { id: gameId },
      data: {
        streamerRequest: { userId: streamerId, status: "PENDING" }
      }
    });

    return res.status(200).json({ success: true, message: "Streamer request sent to host!" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const handleStreamerRequest = async (req, res) => {
  try {
    const hostId = req.user.id || req.user.user;
    const { gameId, action } = req.body;

    const game = await prisma.hostedGame.findFirst({
      where: { id: gameId, hostId }
    });
    if (!game) throw new Error("Unauthorized or game not found");

    if (action === "APPROVE") {
      const currentRequest = game.streamerRequest || {};
      const updatedRequest = { ...currentRequest, status: "APPROVED" };
      await prisma.hostedGame.update({
        where: { id: gameId },
        data: {
          streamerId: game.streamerRequest.userId,
          streamerRequest: updatedRequest
        }
      });
    } else {
      const currentRequest = game.streamerRequest || {};
      const updatedRequest = { ...currentRequest, status: "REJECTED", userId: null };
      await prisma.hostedGame.update({
        where: { id: gameId },
        data: {
          streamerRequest: updatedRequest
        }
      });
    }

    return res.status(200).json({ success: true, message: `Streamer request ${action.toLowerCase()}d successfully!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const requestToScorer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameId } = req.body;

    const game = await prisma.hostedGame.findUnique({
      where: { id: gameId }
    });
    if (!game) throw new Error("Game not found");
    
    if (game.scorerId) throw new Error("This game already has a scorer assigned");
    
    const owner = await prisma.ownerProfile.findFirst({ where: { userId } });
    const scorerId = owner ? owner.id : userId;

    if (game.scorerRequest?.userId === scorerId || game.scorerRequest?.userId === userId) {
      throw new Error("You have already sent a request for this game");
    }

    await prisma.hostedGame.update({
      where: { id: gameId },
      data: {
        scorerRequest: { userId: scorerId, status: "PENDING" }
      }
    });

    return res.status(200).json({ success: true, message: "Scorer request sent to host!" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const handleScorerRequest = async (req, res) => {
  try {
    const hostId = req.user.id || req.user.user;
    const { gameId, action } = req.body;

    const game = await prisma.hostedGame.findFirst({
      where: { id: gameId, hostId }
    });
    if (!game) throw new Error("Unauthorized or game not found");

    if (action === "APPROVE") {
      const currentRequest = game.scorerRequest || {};
      const updatedRequest = { ...currentRequest, status: "APPROVED" };
      await prisma.hostedGame.update({
        where: { id: gameId },
        data: {
          scorerId: game.scorerRequest.userId,
          scorerRequest: updatedRequest
        }
      });
    } else {
      const currentRequest = game.scorerRequest || {};
      const updatedRequest = { ...currentRequest, status: "REJECTED", userId: null };
      await prisma.hostedGame.update({
        where: { id: gameId },
        data: {
          scorerRequest: updatedRequest
        }
      });
    }

    return res.status(200).json({ success: true, message: `Scorer request ${action.toLowerCase()}d successfully!` });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Host invites Scorer/Umpire directly
export const inviteOfficial = async (req, res) => {
  try {
    const hostId = req.user.id || req.user.user;
    const { gameId, officialId, type } = req.body; // type: 'UMPIRE', 'SCORER', 'STREAMER'

    const game = await prisma.hostedGame.findUnique({
      where: { id: gameId }
    });
    
    if (!game || game.hostId !== hostId) throw new Error("Unauthorized or game not found");

    const official = await prisma.user.findUnique({ where: { id: officialId } });
    if (!official) throw new Error("User not found");

    let fieldName = "";
    if (type === "UMPIRE") {
      if (game.umpireId) throw new Error("Umpire already assigned");
      fieldName = "umpireRequest";
    } else if (type === "SCORER") {
      if (game.scorerId) throw new Error("Scorer already assigned");
      fieldName = "scorerRequest";
    } else if (type === "STREAMER") {
      if (game.streamerId) throw new Error("Streamer already assigned");
      fieldName = "streamerRequest";
    }

    if (!fieldName) throw new Error("Invalid official type");

    await prisma.hostedGame.update({
      where: { id: gameId },
      data: {
        [fieldName]: { userId: officialId, status: "PENDING" }
      }
    });

    NotificationService.sendInApp({
      recipientId: officialId,
      title: "Match Official Invitation",
      message: `You have been invited to be a ${type} for a match.`,
      type: "SYSTEM",
      link: `/my-hosted-games`,
      relatedId: gameId,
      onModel: "HostedGame"
    });

    return res.status(200).json({ success: true, message: `${type} invitation sent!` });
  } catch (error) {
    logger.error("Error in inviteOfficial:", error);
    return res.status(500).json({ message: error.message });
  }
};


// Official (Scorer/Umpire/Streamer) responds to invitation
export const respondToOfficialInvitation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameId, type, action } = req.body; // type: 'UMPIRE', 'SCORER', 'STREAMER', action: 'APPROVE', 'REJECT'

    const game = await prisma.hostedGame.findUnique({
      where: { id: gameId }
    });
    if (!game) throw new Error("Game not found");

    let fieldName = "";
    let requestId = "";
    let roleToAssign = "";

    if (type === "UMPIRE") {
      if (game.umpireRequest?.userId !== userId) throw new Error("Unauthorized");
      fieldName = "umpireId";
      requestId = "umpireRequest";
      roleToAssign = "umpire";
    } else if (type === "SCORER") {
      if (game.scorerRequest?.userId !== userId) throw new Error("Unauthorized");
      fieldName = "scorerId";
      requestId = "scorerRequest";
      roleToAssign = "scorer";
    } else if (type === "STREAMER") {
      if (game.streamerRequest?.userId !== userId) throw new Error("Unauthorized");
      fieldName = "streamerId";
      requestId = "streamerRequest";
      roleToAssign = "streamer";
    }

    if (!fieldName) throw new Error("Invalid official type");

    if (action === "APPROVE") {
      const currentRequest = game[requestId] || {};
      const updatedRequest = { ...currentRequest, status: "APPROVED" };
      await prisma.$transaction([
        prisma.hostedGame.update({
          where: { id: gameId },
          data: {
            [fieldName]: userId,
            [requestId]: updatedRequest
          }
        }),
        prisma.user.update({
          where: { id: userId },
          data: { role: roleToAssign }
        })
      ]);
    } else {
      const currentRequest = game[requestId] || {};
      const updatedRequest = { ...currentRequest, status: "REJECTED", userId: null };
      await prisma.hostedGame.update({
        where: { id: gameId },
        data: {
          [requestId]: updatedRequest
        }
      });
    }

    // ── Notify Host ──────────────────────────────────────────────────────────
    try {
      const responder = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      const statusMsg = action === "APPROVE" ? "accepted" : "rejected";
      
      NotificationService.sendInApp({
        recipientId: game.hostId,
        title: `Official Invitation ${action === "APPROVE" ? "Accepted" : "Rejected"}`,
        message: `${responder?.name || "Someone"} has ${statusMsg} your invitation to be the ${type.toLowerCase()} for the match.`,
        type: "SYSTEM",
        link: `/hosted-game/${game.id}`,
        relatedId: game.id,
        onModel: "HostedGame"
      });
    } catch (notifErr) {
      logger.error("[Notification] Error notifying host:", notifErr);
    }

    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    const token = generateUserToken(updatedUser.id, updatedUser.role);

    return res.status(200).json({ 
      success: true, 
      message: `Invitation ${action.toLowerCase()}d successfully!`,
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        role: updatedUser.role,
        email: updatedUser.email
      }
    });
  } catch (error) {
    logger.error("Error in respondToOfficialInvitation:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateVenue = async (req, res) => {
  try {
    const hostId = req.user.id || req.user.user;
    const { gameId, groundId } = req.body;

    const game = await prisma.hostedGame.findFirst({
      where: { id: gameId, hostId }
    });
    if (!game) throw new Error("Unauthorized or game not found");

    const updatedGame = await prisma.hostedGame.update({
      where: { id: gameId },
      data: { turfId: groundId },
      include: { turf: true }
    });
    
    return res.status(200).json({ success: true, message: "Venue updated successfully!", ground: updatedGame.turf });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const searchOfficials = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(200).json({ success: true, officials: [] });

    // Search in User model (Postgres)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        profilePicture: true,
        city: true,
        state: true,
        email: true
      },
      take: 20
    });

    // Map them for frontend
    const officials = users.map(u => ({
      id: u.id,
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

    const game = await prisma.hostedGame.findUnique({ where: { id } });
    if (!game) throw new Error("Game not found");

    const userId = req.user.id;
    const owner = await prisma.ownerProfile.findFirst({ where: { userId } });
    const streamerId = owner ? owner.id : userId;

    if (game.streamerId !== streamerId && game.hostId !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized to update stream configuration" });
    }

    const updatedConfig = {
      ...(game.streamConfig || {}),
      ...config
    };

    const isLive = config.status ? (config.status === "LIVE") : game.isLive;

    const updatedGame = await prisma.hostedGame.update({
      where: { id },
      data: {
        streamConfig: updatedConfig,
        isLive
      }
    });

    return res.status(200).json({ success: true, message: "Stream configuration updated successfully!", streamConfig: updatedGame.streamConfig });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getHostedGameById = async (req, res) => {
  try {
    const { id } = req.params;
    const game = await prisma.hostedGame.findUnique({
      where: { id },
      include: fullGameInclude
    });

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    await populateRequestUsers([game]);

    // Official setup status for gating
    const officialSetupStatus = {
      hasUmpire: !!game.umpireId,
      hasScorer: !!game.scorerId,
      isUmpireApproved: game.umpireRequest?.status === 'APPROVED' || !!game.umpireId,
      isScorerApproved: game.scorerRequest?.status === 'APPROVED' || !!game.scorerId,
      streamingEnabled: (!!game.umpireId || game.umpireRequest?.status === 'APPROVED') && 
                         (!!game.scorerId || game.scorerRequest?.status === 'APPROVED')
    };

    return res.status(200).json({ 
      success: true, 
      game: formatGameForClient(game),
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
    const { gameId, slotId, userId } = req.body;

    if (!slotId || !userId) {
      return res.status(400).json({ message: "slotId and userId are required" });
    }

    const game = await prisma.hostedGame.findFirst({
      where: { id: gameId, hostId }
    });
    if (!game) return res.status(404).json({ message: "Game not found or unauthorized" });
    if (game.gameMode !== "QUICK") {
      return res.status(400).json({ message: "Only Quick Games support slot assignment" });
    }

    await prisma.gameSlot.update({
      where: { id: slotId },
      data: {
        userId,
        status: "HELD",
        addedById: hostId
      }
    });

    return res.status(200).json({ success: true, message: "Slot assigned successfully" });
  } catch (error) {
    logger.error("[assignQuickSlot]", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2C — Invite an off-platform custom player to a Quick Game slot
// ─────────────────────────────────────────────────────────────────────────────
export const inviteCustomPlayer = async (req, res) => {
  try {
    const hostId = req.user.id || req.user.user;
    const { gameId, slotId, name, email, phone, mustPay } = req.body;

    if (!email || !name || !slotId) {
      return res.status(400).json({ message: "name, email, and slotId are required" });
    }

    const game = await prisma.hostedGame.findFirst({
      where: { id: gameId, hostId }
    });
    if (!game) return res.status(404).json({ message: "Game not found or unauthorized" });
    if (game.gameMode !== "QUICK") {
      return res.status(400).json({ message: "Only Quick Games support custom invites" });
    }

    const token = randomUUID();
    
    // Create custom player record and update slot atomically
    await prisma.$transaction(async (tx) => {
      const customPlayer = await tx.customPlayer.create({
        data: {
          gameId,
          name,
          email,
          phone: phone || "",
          mustPay: !!mustPay,
          inviteToken: token,
          inviteStatus: "PENDING"
        }
      });

      await tx.gameSlot.update({
        where: { id: slotId },
        data: {
          status: "HELD",
          addedById: hostId,
          customPlayerId: customPlayer.id
        }
      });
      
      // Fire invite email (background)
      const host = await tx.user.findUnique({ where: { id: hostId }, select: { name: true, email: true, phone: true } });
      NotificationService.sendCustomPlayerInvite({ customPlayer, game, host });
    });

    return res.status(200).json({ success: true, message: "Invitation sent!" });
  } catch (error) {
    logger.error("[inviteCustomPlayer]", error);
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
    let customPlayer = await prisma.customPlayer.findUnique({
      where: { inviteToken: token },
      include: { game: true }
    });

    let inviteType = "PLAYER";
    let inviteData = null;
    let game = null;

    if (customPlayer && customPlayer.inviteStatus === "PENDING") {
      inviteData = customPlayer;
      game = customPlayer.game;
    } else {
      // Try finding umpire invite
      let customUmpire = await prisma.customUmpire.findUnique({
        where: { inviteToken: token },
        include: { game: true }
      });
      
      if (customUmpire && customUmpire.inviteStatus === "PENDING") {
        inviteType = "UMPIRE";
        inviteData = customUmpire;
        game = customUmpire.game;
      }
    }

    if (!game || !inviteData) {
      return res.status(404).json({ message: "Invite not found or already used" });
    }

    return res.status(200).json({
      success: true,
      gameId: game.id,
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
    logger.error("[verifyInviteToken]", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2E — Return followers + following for the slot picker popup
// ─────────────────────────────────────────────────────────────────────────────
export const getFollowersForSlot = async (req, res) => {
  try {
    const userId = req.user.id;

    const { followers, following } = await SocialService.getNetwork(userId);
    
    // Union of followers + following, de-duped by id
    const seen = new Set();
    const people = [];
    [...followers, ...following].forEach(u => {
      const key = u.id.toString();
      if (!seen.has(key)) {
        seen.add(key);
        people.push(u);
      }
    });

    return res.status(200).json({ success: true, people });
  } catch (error) {
    logger.error("[getFollowersForSlot]", error);
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
    const result = await prisma.$transaction(async (tx) => {
      const userId = req.user.id;
      const { token } = req.body;

      if (!token) throw new Error("Token is required");

      // Try player invite first
      let customPlayer = await tx.customPlayer.findUnique({
        where: { inviteToken: token },
        include: { game: true }
      });

      let isUmpire = false;
      let inviteData = null;
      let game = null;

      if (customPlayer && customPlayer.inviteStatus === "PENDING") {
        inviteData = customPlayer;
        game = customPlayer.game;
      } else {
        // Try umpire invite
        let customUmpire = await tx.customUmpire.findUnique({
          where: { inviteToken: token },
          include: { game: true }
        });
        if (customUmpire && customUmpire.inviteStatus === "PENDING") {
          isUmpire = true;
          inviteData = customUmpire;
          game = customUmpire.game;
        }
      }

      if (!game || !inviteData) throw new Error("Invite not found or already claimed");

      if (isUmpire) {
        // Handle Umpire Claim
        await tx.customUmpire.update({
          where: { id: inviteData.id },
          data: {
            inviteStatus: "ACCEPTED",
            claimedByUserId: userId
          }
        });
        
        let owner = await tx.ownerProfile.findFirst({ where: { userId } });
        
        if (!owner) {
          const userDetails = await tx.user.findUnique({ where: { id: userId } });
          if (userDetails) {
            owner = await tx.ownerProfile.create({
              data: {
                userId: userId,
                name: userDetails.name || inviteData.name,
                email: userDetails.email || inviteData.email,
                phone: userDetails.phone || inviteData.phone || "",
                role: "LIMITED_UMPIRE",
                businessName: userDetails.name || inviteData.name || "Independent Partner"
              }
            });
            
            await tx.user.update({
              where: { id: userId },
              data: {
                role: "LIMITED_UMPIRE",
                ownerDetailsId: owner.id
              }
            });
            
            updatedRole = "LIMITED_UMPIRE";
            updatedOwnerId = owner.id;
          }
        } else if (["VENUE_OWNER", "OWNER", "USER"].includes(owner.role)) {
          await tx.ownerProfile.update({
            where: { id: owner.id },
            data: { role: "LIMITED_UMPIRE" }
          });
          await tx.user.update({
            where: { id: userId },
            data: { role: "LIMITED_UMPIRE" }
          });
          
          updatedRole = "LIMITED_UMPIRE";
          updatedOwnerId = owner.id;
        }

        await tx.hostedGame.update({
          where: { id: game.id },
          data: {
            umpireId: owner ? owner.id : userId,
            umpireRequest: { userId: owner ? owner.id : userId, status: "APPROVED" }
          }
        });

      } else {
        // Handle Player Claim
        if (inviteData.mustPay && game.perPlayerCharge > 0) {
          await WalletService.reserve(userId, 'user', game.perPlayerCharge, tx);
        }

        // Update custom player status
        await tx.customPlayer.update({
          where: { id: inviteData.id },
          data: {
            inviteStatus: "CLAIMED",
            claimedByUserId: userId
          }
        });
        
        // Find the slot and update it
        const slot = await tx.gameSlot.findFirst({
          where: { gameId: game.id, customPlayerId: inviteData.id }
        });

        if (slot) {
          await tx.gameSlot.update({
            where: { id: slot.id },
            data: {
              userId,
              status: "JOINED"
            }
          });
        }
      }

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
    logger.error("[claimInviteSlot]", error);
    return res.status(error.status || 500).json({ message: error.message });
  }
};

export const updateTickerTheme = async (req, res) => {
  try {
    const { id } = req.params;
    const { tickerTheme } = req.body;
    const userId = req.user.id || req.user.user;

    const game = await prisma.hostedGame.findUnique({ where: { id } });
    if (!game) throw new Error("Game not found");

    // Authorization: Only Host, assigned Streamer, or Scorer
    const isAuthorizedUser = (game.hostId === userId || game.streamerId === userId || game.scorerId === userId) && userId !== undefined;
    const isAuthorizedScorer = req.user.role === 'SCORER' && req.user.gameId === id;
    
    if (!isAuthorizedUser && !isAuthorizedScorer) {
      return res.status(403).json({ success: false, message: "Unauthorized to update ticker theme" });
    }

    const updatedGame = await prisma.hostedGame.update({
      where: { id },
      data: { tickerTheme }
    });

    // Update Redis cache live score theme if it exists
    try {
      const cachedScore = await liveStateService.getLiveScore(id);
      if (cachedScore) {
        cachedScore.tickerTheme = tickerTheme;
        await liveStateService.setLiveScore(id, cachedScore);
        
        // Broadcast theme & score updates via Socket.IO
        const io = getIO();
        if (io) {
          io.to(id).emit("scoreUpdated", cachedScore);
          io.to(id).emit("themeUpdated", tickerTheme);
        }
      } else {
        // Even if no score is cached, still broadcast theme update
        const io = getIO();
        if (io) {
          io.to(id).emit("themeUpdated", tickerTheme);
        }
      }
    } catch (cacheErr) {
      logger.error("[Scoring] Redis/Socket error on ticker theme update:", cacheErr);
    }
    
    return res.status(200).json({ success: true, game: updatedGame });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
