const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      {
        folder: "chatsphere",
        resource_type: "auto",
      }
    );

    res.json({
      fileUrl: result.secure_url,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Upload failed",
    });
  }
});

module.exports = router;