const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");
const { getMessaging } = require("../config/firebaseAdmin");

// 🔥 SEND MESSAGE (UPDATED)
router.post("/", async (req, res) => {
  try {
    const {
      sender,
      receiver,
      content,
      file,
      replyTo,
    } = req.body;

    if (!sender || !receiver) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Save message
    const newMessage = await Message.create({
      sender,
      receiver,
      content,
      file,
      replyTo,
    });

    // Get receiver and sender information
    const receiverUser = await User.findById(receiver);
    const senderUser = await User.findById(sender);

    // Send FCM notification if receiver has a token
    if (receiverUser?.fcmToken) {
      try {
        // Count unread messages for receiver
        const unreadCount = await Message.countDocuments({
          receiver: receiver,
          status: { $ne: "seen" },
        });

        await getMessaging().send({
          token: receiverUser.fcmToken,

          // Data-only payload
          // Service worker will handle the notification
          data: {
            title: senderUser?.name || "New Message",
            body: content || "📎 Sent you a file",
            unreadCount: String(unreadCount),
            url: "/chat",
          },
        });

        console.log("FCM notification sent successfully");
      } catch (fcmError) {
        console.log("FCM notification error:", fcmError.message);
      }
    }

    res.json(newMessage);

  } catch (error) {
    console.log("SEND MESSAGE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});



router.delete("/:id", async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
});

// 🔥 GET LAST MESSAGE OF EACH USER
router.get("/last/all", async (req, res) => {
  try {

    const messages = await Message.find()
      .sort({ createdAt: -1 });

    const lastMessages = {};

    messages.forEach((msg) => {

      const otherUser =
        msg.sender.toString();

      if (!lastMessages[otherUser]) {
        lastMessages[otherUser] = msg;
      }
    });

    res.json(lastMessages);

  } catch (err) {
    res.status(500).json({
      message: "Server Error"
    });
  }
});

// 👀 MARK MESSAGE AS SEEN
router.put("/seen/:id", async (req, res) => {
  try {

    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        message: "Message not found",
      });
    }

    message.status = "seen";

    await message.save();

    res.json(message);

  } catch (err) {
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// 🔥 GET MESSAGES BETWEEN TWO USERS
router.get("/:userId", async (req, res) => {
  try {
    const { senderId } = req.query;

    if (!senderId) {
      return res.status(400).json({ message: "senderId required" });
    }

    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: req.params.userId },
        { sender: req.params.userId, receiver: senderId },
      ],
    })
      .populate({
        path: "replyTo",
        populate: {
          path: "sender",
          select: "name",
        },
      })
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.log("GET MESSAGE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;