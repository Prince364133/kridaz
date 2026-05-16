import { Server } from "socket.io";
import { redisClient as redis } from "./redis.js";
import User from "../models/user.model.js";

let io;

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

const socketConfig = (server) => {
  io = new Server(server, {
    pingTimeout: 60000,
    cors: {
      origin: process.env.CLIENT_URLS 
        ? process.env.CLIENT_URLS.split(",").map((url) => url.trim()) 
        : ["http://localhost:5174", "https://kridaz.vercel.app"],
    },
  });

  const onlineUsers = new Map(); // Local fallback — kept for within-process lookups

  // ── Redis presence tracking ─────────────────────────────────────────────────

  // Debounce: batch all presence changes within a 2-second window into one broadcast
  let presenceTimer = null;
  const schedulePresenceBroadcast = async () => {
    if (presenceTimer) return;
    presenceTimer = setTimeout(async () => {
      try {
        const count = await redis.scard('kridaz:online:users');
        io.emit('online_users_count', { count });
      } catch (e) { /* silent — presence is non-critical */ } finally {
        presenceTimer = null;
      }
    }, 2000);
  };

  io.on("connection", (socket) => {
    socket.on("setup", (userData) => {
      const userId = userData?.id || userData?._id;
      if (!userId) return;

      socket.userId = userId;
      socket.join(userId);

      onlineUsers.set(userId, {
        odid: userId,
        socketId: socket.id,
        lastSeen: new Date(),
      });

      User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch(err => console.log("DB Update Error:", err));

      // Redis-backed presence — cross-instance, debounced broadcast
      redis.sadd('kridaz:online:users', userId.toString())
        .then(() => redis.expire('kridaz:online:users', 86400)) // 24-hr TTL safety net
        .then(() => schedulePresenceBroadcast())
        .catch(() => { /* non-critical */ });
      socket.emit("connected");
    });

    socket.on("join chat", (room) => socket.join(room));

    socket.on("joinMatch", async (matchId) => {
      socket.join(matchId);


      // Phase 3: snap-on-join — send current live score immediately
      try {
        const { liveStateService } = await import("../services/liveState.service.js");
        const snapshot = await liveStateService.getLiveScore(matchId);
        if (snapshot) socket.emit("scoreUpdated", snapshot);
      } catch (e) {
        console.warn("[Socket] snap-on-join failed:", e.message);
      }
    });

    // Phase 3: OBS overlay joins with a JWT token for verification
    socket.on("overlayJoin", async ({ matchId, token }) => {
      try {
        const jwt = await import("jsonwebtoken");
        const secret = process.env.OVERLAY_TOKEN_SECRET;
        if (!secret) {
          console.error('[FATAL] OVERLAY_TOKEN_SECRET env var is not set.');
          socket.emit('overlayError', { message: 'Server configuration error' });
          return;
        }
        const payload = jwt.default.verify(token, secret);
        if (payload && payload.matchId?.toString() === matchId?.toString()) {
          socket.join(matchId);
          // Send current snapshot to this overlay client
          const { liveStateService } = await import("../services/liveState.service.js");
          const snapshot = await liveStateService.getLiveScore(matchId);
          if (snapshot) socket.emit("scoreUpdated", snapshot);
        } else {
          socket.emit("overlayError", { message: "Invalid overlay token" });
        }
      } catch (e) {
        console.warn("[Socket] overlayJoin token error:", e.message);
        socket.emit("overlayError", { message: "Token verification failed" });
      }
    });

    socket.on("scoreUpdate", (data) => {
      const { matchId, score } = data;
      socket.to(matchId).emit("scoreUpdated", score);
    });

    socket.on("typing", (room) => socket.in(room).emit("typing", room));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing", room));

    socket.on("new message", (newMessageRecieved) => {
      var chat = newMessageRecieved.chat;
      if (!chat.users) return;

      chat.users.forEach((u) => {
        const userId = u.user?._id || u.user;
        const senderId =
          newMessageRecieved.sender?.user?._id ||
          newMessageRecieved.sender?.user ||
          newMessageRecieved.sender?._id ||
          newMessageRecieved.sender;
        if (userId == senderId) return;

        socket.in(userId).emit("message recieved", newMessageRecieved);
      });
    });

    socket.on("messages read", ({ chatId, userId }) => {
      socket.in(chatId).emit("messages read", { chatId, userId });
    });

    socket.on("delete message", (data) => {
      const { chatId, messageIds } = data;
      socket.in(chatId).emit("message deleted", { chatId, messageIds });
    });

    socket.on("update_location", async (data) => {
      const { lat, lng } = data;
      if (!socket.userId || isNaN(lat) || isNaN(lng)) return;
      try {
        await User.findByIdAndUpdate(socket.userId, {
          locationData: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          }
        });
      } catch (err) {
        console.error("Error updating location via socket:", err.message);
      }
    });
 
    socket.on("location:update", async (data) => {
      // data = { lat, lng }
      const { lat, lng } = data;
      if (!socket.userId || !lat || !lng) return;
 
      // Rate limiting (per socket)
      const now = Date.now();
      if (socket.lastLocationUpdate && now - socket.lastLocationUpdate < 2000) {
        return;
      }
      socket.lastLocationUpdate = now;
 
      try {
        // Store location in Redis with 5-minute TTL
        await redis.set(
          `kridaz:location:${socket.userId}`,
          JSON.stringify({ lat: data.lat, lng: data.lng, updatedAt: now }),
          "EX",
          300
        );
 
        // Update MongoDB (debounced — only every 30 seconds per user)
        if (!socket.lastDbLocationWrite || now - socket.lastDbLocationWrite > 30000) {
          User.findByIdAndUpdate(socket.userId, {
            locationData: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] }
          }).catch(() => {});
          socket.lastDbLocationWrite = now;
        }
 
        // Find nearby online users to notify
        // Performance: O(n) over online users. Production scale > 10k users use GEORADIUS.
        for (const [uid, presence] of onlineUsers.entries()) {
          if (uid.toString() === socket.userId.toString()) continue;
 
          const targetLocRaw = await redis.get(`kridaz:location:${uid}`);
          if (targetLocRaw) {
            const targetLoc = JSON.parse(targetLocRaw);
            const dist = haversineDistance(lat, lng, targetLoc.lat, targetLoc.lng);
 
            if (dist <= 10000) { // 10km radius
              io.to(uid.toString()).emit("nearby:location:update", {
                userId: socket.userId,
                lat,
                lng
              });
            }
          }
        }
      } catch (err) {
        console.error("Location update socket error:", err);
      }
    });
 
    socket.on("location:start", async (data) => {
      // data = { lat, lng, radiusKm }
      const { lat, lng } = data;
      if (!socket.userId || !lat || !lng) return;
 
      try {
        await redis.set(
          `kridaz:location:${socket.userId}`,
          JSON.stringify({ lat, lng, updatedAt: Date.now() }),
          "EX",
          300
        );
        socket.emit("location:start:ack", { success: true });
      } catch (err) {
        console.error("Location start socket error:", err);
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        const lastSeen = new Date();
        onlineUsers.delete(socket.userId);
        User.findByIdAndUpdate(socket.userId, { lastSeen }).catch(err => console.log("DB Update Error:", err));

        // Redis-backed presence — remove and debounce the broadcast
        redis.srem('kridaz:online:users', socket.userId.toString())
          .then(() => schedulePresenceBroadcast())
          .catch(() => { /* non-critical */ });
 
        // Clear real-time location from Redis
        redis.del(`kridaz:location:${socket.userId}`).catch(() => {});

        io.emit("user last seen", { userId: socket.userId, lastSeen }); // kept as-is
      }
    });
  });
};

export const getIO = () => io;
export default socketConfig;
