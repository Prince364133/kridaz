import { Server } from "socket.io";
import User from "../models/user.model.js";

const socketConfig = (server) => {
  const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174"],
      // credentials: true,
    },
  });

  // Track online users: { odid: { odid, socketId, lastSeen } }
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("Connected to socket.io");

    // ── Setup: user comes online ──
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

      // Update lastSeen in DB
      User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch(err => console.log("DB Update Error:", err));

      // Broadcast updated online list to everyone
      io.emit("online users", Array.from(onlineUsers.keys()));
      console.log(`User online: ${userId}`);
      socket.emit("connected");
    });

    // ── Join a chat room ──
    socket.on("join chat", (room) => {
      socket.join(room);
      console.log("User Joined Room: " + room);
    });

    // ── Typing indicators (include room so receiver can filter) ──
    socket.on("typing", (room) => socket.in(room).emit("typing", room));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing", room));

    // ── New message ──
    socket.on("new message", (newMessageRecieved) => {
      var chat = newMessageRecieved.chat;

      if (!chat.users) return console.log("chat.users not defined");

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

    // ── Mark messages as read ──
    socket.on("messages read", ({ chatId, userId }) => {
      socket.in(chatId).emit("messages read", { chatId, userId });
    });

    // ── Disconnect: user goes offline ──
    socket.on("disconnect", () => {
      if (socket.userId) {
        // Store last seen timestamp before removing
        const lastSeen = new Date();
        onlineUsers.delete(socket.userId);

        // Update lastSeen in DB
        User.findByIdAndUpdate(socket.userId, { lastSeen }).catch(err => console.log("DB Update Error:", err));

        // Broadcast updated online list + last seen
        io.emit("online users", Array.from(onlineUsers.keys()));
        io.emit("user last seen", { userId: socket.userId, lastSeen });
        console.log(`User offline: ${socket.userId}`);
      }
    });
  });
};

export default socketConfig;
