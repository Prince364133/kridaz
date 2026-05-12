import { Server } from "socket.io";
import User from "../models/user.model.js";

let io;

const socketConfig = (server) => {
  io = new Server(server, {
    pingTimeout: 60000,
    cors: {
      origin: process.env.CLIENT_URLS 
        ? process.env.CLIENT_URLS.split(",").map((url) => url.trim()) 
        : ["http://localhost:5173", "http://localhost:5174", "https://kridaz.vercel.app"],
    },
  });

  const onlineUsers = new Map();

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
      io.emit("online users", Array.from(onlineUsers.keys()));
      socket.emit("connected");
    });

    socket.on("join chat", (room) => socket.join(room));

    socket.on("joinMatch", async (matchId) => {
      socket.join(matchId);
      console.log(`[Socket] User joined Match Room: ${matchId}`);

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
        const secret = process.env.OVERLAY_TOKEN_SECRET || "fallback_secret";
        const payload = jwt.default.verify(token, secret);
        if (payload && payload.matchId?.toString() === matchId?.toString()) {
          socket.join(matchId);
          console.log(`[Socket] Verified overlay joined match room: ${matchId}`);
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

    socket.on("disconnect", () => {
      if (socket.userId) {
        const lastSeen = new Date();
        onlineUsers.delete(socket.userId);
        User.findByIdAndUpdate(socket.userId, { lastSeen }).catch(err => console.log("DB Update Error:", err));
        io.emit("online users", Array.from(onlineUsers.keys()));
        io.emit("user last seen", { userId: socket.userId, lastSeen });
      }
    });
  });
};

export const getIO = () => io;
export default socketConfig;
