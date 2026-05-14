const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");


// 🔥 STORE ONLINE USERS
let onlineUsers = {}; // { userId: socketId }

// Load env variables
dotenv.config();

// Connect Database
connectDB();

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(express.json());
app.use(cors());

// Routes
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



const path = require("path");

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res) => {
      res.set("Accept-Ranges", "bytes");
    },
  })
);

// 🔥 SOCKET CONNECTION
// 🔥 SOCKET CONNECTION
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ JOIN ROOM + ONLINE TRACK
  socket.on("join", (userId) => {
    socket.join(userId);

    // save socket id
    onlineUsers[userId] = socket.id;

    console.log("Online Users:", onlineUsers);

    io.emit("getOnlineUsers", Object.keys(onlineUsers));
  });

  // ════════════════════════════════
  // 📞 AUDIO CALL EVENTS
  // ════════════════════════════════

  // CALL USER
  socket.on("callUser", ({ to, from }) => {
    console.log(`${from.name} is calling ${to}`);

    const targetSocket = onlineUsers[to];

    if (targetSocket) {
      io.to(targetSocket).emit("incomingCall", {
        from,
      });
    }
  });

  // CALL ACCEPT
  socket.on("acceptCall", ({ to, by }) => {
    const targetSocket = onlineUsers[to];

    if (targetSocket) {
      io.to(targetSocket).emit("callAccepted", {
        by,
      });
    }
  });

  // CALL REJECT
  socket.on("rejectCall", ({ to, by }) => {
    const targetSocket = onlineUsers[to];

    if (targetSocket) {
      io.to(targetSocket).emit("callRejected", {
        by,
      });
    }
  });

  // END CALL
  socket.on("endCall", ({ to }) => {
    const targetSocket = onlineUsers[to];

    if (targetSocket) {
      io.to(targetSocket).emit("callEnded");
    }
  });



  // WEBRTC SIGNAL
  socket.on("callSignal", ({ to, signal }) => {
    const targetSocket = onlineUsers[to];

    if (targetSocket) {
      io.to(targetSocket).emit("callSignal", signal);
    }
  });

  // ════════════════════════════════
  // 💬 PRIVATE MESSAGE
  // ════════════════════════════════

  socket.on("sendMessage", (data) => {
    const { receiver, sender } = data;

    console.log(`Message from ${sender} to ${receiver}`);

    io.to(receiver).emit("receiveMessage", data);
    io.to(sender).emit("receiveMessage", data);
  });

  // ⌨️ TYPING
  socket.on("typing", ({ sender, receiver }) => {
    io.to(receiver).emit("typing", sender);
  });

  socket.on("stopTyping", ({ sender, receiver }) => {
    io.to(receiver).emit("stopTyping", sender);
  });

  // 👁️ MESSAGE DELIVERED
  socket.on("messageDelivered", (message) => {
    io.to(message.sender).emit("messageDelivered", message._id);
  });

  // 👁️ MESSAGE SEEN
  socket.on("messageSeen", (message) => {
    io.to(message.sender).emit("messageSeen", message._id);
  });

  // 👀 MESSAGE SEEN
  socket.on("messageSeen", (messageId) => {
    io.emit("messageSeen", messageId);
  });

  // 🗑️ DELETE MESSAGE
  socket.on("deleteMessage", (messageId) => {
    io.emit("messageDeleted", messageId);
  });

  // 👤 PROFILE UPDATE
  socket.on("profileUpdated", (updatedUser) => {
    io.emit("profileUpdated", updatedUser);
  });

  // ❌ DISCONNECT
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        break;
      }
    }

    io.emit("getOnlineUsers", Object.keys(onlineUsers));
  });
});

// Port
const PORT = process.env.PORT || 5000;

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});