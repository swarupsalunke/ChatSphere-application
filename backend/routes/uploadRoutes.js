// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const path = require("path");

// // storage config
// const storage = multer.diskStorage({
//   destination: "uploads/",
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage });

// // upload route
// router.post("/", upload.single("file"), (req, res) => {
//   const baseUrl =
//     process.env.NODE_ENV === "production"
//       ? "https://chatsphere-application-2.onrender.com"
//       : "http://localhost:5000";

//   res.json({
//     fileUrl: `${baseUrl}/uploads/${req.file.filename}`,
//   });
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
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