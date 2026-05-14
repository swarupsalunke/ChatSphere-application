const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

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

    // basic validation
    if (!sender || !receiver) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const newMessage = await Message.create({
      sender,
      receiver,
      content,
      file,
      replyTo,
    });

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