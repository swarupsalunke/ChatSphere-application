
const express = require("express");const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "chatsphere",
    resource_type: "auto",
  },
});

const upload = multer({ storage });

router.post("/", upload.single("file"), (req, res) => {
  res.json({
    fileUrl: req.file.path,
  });
});

module.exports = router;