const express = require("express");
const router = express.Router();

const Status = require("../models/Status");


// 🔥 ADD STATUS
router.post("/", async (req, res) => {
  try {

    const { user, media, caption } = req.body;

    const status = await Status.create({
      user,
      media,
      caption,
    });

    const populatedStatus =
      await Status.findById(status._id)
        .populate("user", "name profilePic");

    res.json(populatedStatus);

  } catch (err) {
    res.status(500).json({
      message: "Server Error",
    });
  }
});


const {
  createStatus,
  getStatuses,
  deleteStatus,
} = require("../controllers/statusController");

router.post("/", createStatus);

router.get("/", getStatuses);

// DELETE STATUS
router.delete("/:id", deleteStatus);



// 🔥 GET ALL STATUS (24 HOURS)
router.get("/", async (req, res) => {
  try {

    // last 24hr
    const last24Hours = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    );

    const statuses = await Status.find({
      createdAt: {
        $gte: last24Hours,
      },
    })
      .populate("user", "name profilePic")
      .sort({ createdAt: -1 });

    res.json(statuses);

  } catch (err) {
    res.status(500).json({
      message: "Server Error",
    });
  }
});

module.exports = router;