import { Server } from "socket.io";

const socketConfig = (server) => {
  const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174"],
      // credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Connected to socket.io");

    socket.on("setup", (userData) => {
      socket.join(userData.id);
      console.log(`User joined room: ${userData.id}`);
      socket.emit("connected");
    });

    socket.on("join chat", (room) => {
      socket.join(room);
      console.log("User Joined Room: " + room);
    });

    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

    socket.on("new message", (newMessageRecieved) => {
      var chat = newMessageRecieved.chat;

      if (!chat.users) return console.log("chat.users not defined");

      chat.users.forEach((u) => {
        const userId = u.user?._id || u.user;
        if (userId == newMessageRecieved.sender.user._id) return;

        socket.in(userId).emit("message recieved", newMessageRecieved);
      });
    });

    socket.off("setup", () => {
      console.log("USER DISCONNECTED");
      socket.leave(userData.id);
    });
  });
};

export default socketConfig;
