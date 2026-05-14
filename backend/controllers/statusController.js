const Status = require("../models/Status");

// CREATE STATUS
const createStatus = async (req, res) => {
  try {
    const status = await Status.create(req.body);

    const populated = await Status.findById(status._id)
      .populate("user", "name profilePic");

    res.status(201).json(populated);

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// GET ALL STATUS
const getStatuses = async (req, res) => {
  try {
    const statuses = await Status.find()
      .populate("user", "name profilePic")
      .sort({ createdAt: -1 });

    res.json(statuses);

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// DELETE STATUS
const deleteStatus = async (req, res) => {
  try {
    const status = await Status.findByIdAndDelete(req.params.id);

    if (!status) {
      return res.status(404).json({
        message: "Status not found",
      });
    }

    res.json({
      message: "Status deleted",
    });

  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = {
  createStatus,
  getStatuses,
  deleteStatus,
};