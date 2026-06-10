const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");


// 🔥 REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profilePic: "", // 🔥 DEFAULT DP
    });

    res.json({
      _id: user._id,
      name: user.name,
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

module.exports = router;