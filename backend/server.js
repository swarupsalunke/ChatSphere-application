const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// Load env
dotenv.config();

// Connect DB
connectDB();

const app = express();
const server = http.createServer(app);

// =========================
// CORS
// =========================

const allowedOrigins = [
  "http://localhost:5173",
  "https://chat-sphere-application.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// =========================
// SOCKET.IO
// =========================

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Store online users
let onlineUsers = {};

// =========================
// ROUTES
// =========================

app.get("/", (req, res) => {
  res.send("API is running...");
});

const userRoutes = require("./routes/userRoutes");
app.use("/api/user", userRoutes);

const messageRoutes = require("./routes/messageRoutes");
app.use("/api/message", messageRoutes);

const statusRoutes = require("./routes/statusRoutes");
app.use("/api/status", statusRoutes);

const uploadRoutes = require("./routes/uploadRoutes");
app.use("/api/upload", uploadRoutes);

// Uploads
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res) => {
      res.set("Accept-Ranges", "bytes");
    },
  })
);

// =========================
// SOCKET EVENTS
// =========================

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);

    onlineUsers[userId] = socket.id;

    io.emit("getOnlineUsers", Object.keys(onlineUsers));
  });

  socket.on("callUser", ({ to, from }) => {
    const targetSocket = onlineUsers[to];

    if (targetSocket) {
      io.to(targetSocket).emit("incomingCall", { from });
    }
  });

  socket.on("acceptCall", ({ to, by }) => {
    const targetSocket = onlineUsers[to];

    if (targetSocket) {
      io.to(targetSocket).emit("callAccepted", { by });
    }
  });

  socket.on("rejectCall", ({ to, by }) => {
    const targetSocket = onlineUsers[to];

    if (targetSocket) {
      io.to(targetSocket).emit("callRejected", { by });
    }
  });

  socket.on("endCall", ({ to }) => {
    const targetSocket = onlineUsers[to];

    if (targetSocket) {
      io.to(targetSocket).emit("callEnded");
    }
  });

  socket.on("callSignal", ({ to, signal }) => {
    const targetSocket = onlineUsers[to];

    if (targetSocket) {
      io.to(targetSocket).emit("callSignal", signal);
    }
  });

  socket.on("sendMessage", (data) => {
    const { receiver, sender } = data;

    io.to(receiver).emit("receiveMessage", data);
    io.to(sender).emit("receiveMessage", data);
  });

  socket.on("typing", ({ sender, receiver }) => {
    io.to(receiver).emit("typing", sender);
  });

  socket.on("stopTyping", ({ sender, receiver }) => {
    io.to(receiver).emit("stopTyping", sender);
  });

  socket.on("messageDelivered", (message) => {
    io.to(message.sender).emit("messageDelivered", message._id);
  });

  socket.on("messageSeen", (messageId) => {
    io.emit("messageSeen", messageId);
  });

  socket.on("deleteMessage", (messageId) => {
    io.emit("messageDeleted", messageId);
  });

  socket.on("profileUpdated", (updatedUser) => {
    io.emit("profileUpdated", updatedUser);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        break;
      }
    }

    io.emit("getOnlineUsers", Object.keys(onlineUsers));
  });
});

// =========================
// START SERVER
// =========================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});