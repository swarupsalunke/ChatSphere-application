const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { getMessaging } = require("../config/firebaseAdmin");


// 🔥 REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    const normalizedPhone = String(phone).replace(/\D/g, "").slice(-10);

    if (!phone) {
      return res.status(400).json({
        message: "Phone number is required",
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists" });
    }

    const phoneExists = await User.findOne({
  phone: normalizedPhone,
});

    if (phoneExists) {
      return res.status(400).json({
        message: "Phone number already registered",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      phone: normalizedPhone,
      email,
      password: hashedPassword,
      profilePic: "", // 🔥 DEFAULT DP
    });

    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      profilePic: user.profilePic,
      fcmToken: user.fcmToken,
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});



// 🔥 LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (
      user &&
      (await bcrypt.compare(password, user.password))
    ) {
      res.json({
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        profilePic: user.profilePic, // 🔥 RETURN DP
        fcmToken: user.fcmToken,
      });
    } else {
      res
        .status(401)
        .json({ message: "Invalid credentials" });
    }

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});


// 🔥 GET ALL USERS
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});






// 🔥 FIND CHATSPHERE USERS FROM PHONE CONTACTS
router.post("/find-contacts", async (req, res) => {
  try {
    const { phoneNumbers } = req.body;

    if (!Array.isArray(phoneNumbers)) {
      return res.status(400).json({
        message: "phoneNumbers must be an array",
      });
    }

    // Clean phone numbers
    const cleanedNumbers = phoneNumbers
  .map((phone) => {
    let number = String(phone).replace(/\D/g, "");

    // India country code remove
    if (number.length === 12 && number.startsWith("91")) {
      number = number.slice(2);
    }

    return number;
  })
  .filter((phone) => phone.length === 10);

    // Find only registered users
    const users = await User.find({
      phone: { $in: cleanedNumbers },
    }).select("-password");

    res.json(users);
  } catch (error) {
    console.log("FIND CONTACTS ERROR:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
});








// 🔥 UPDATE PROFILE
router.put("/profile/:id", async (req, res) => {
  try {
    const { name, profilePic } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found" });
    }

    // 🔥 UPDATE
    user.name = name || user.name;
    user.profilePic = profilePic || user.profilePic;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      profilePic: updatedUser.profilePic,
      fcmToken: updatedUser.fcmToken,
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.put("/fcm-token/:id", async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { fcmToken: token },
      { new: true }
    );

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: "Failed to save token" });
  }
});


router.get("/test-notification/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.fcmToken) {
      return res.status(404).json({
        message: "FCM token not found",
      });
    }

    await getMessaging().send({
      token: user.fcmToken,
      notification: {
        title: "ChatSphere",
        body: "Push Notification Test 🚀",
      },
    });

    res.json({
      success: true,
      message: "Notification sent",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Notification failed",
    });
  }
});

module.exports = router;