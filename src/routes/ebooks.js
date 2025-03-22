const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const {
  uploadEbook,
  downloadEbook,
  getAllEbooks,
} = require("../controllers/Ebooks");
const authMiddleware = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/ebooks/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Filter to accept only PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // limiting file size to 5MB
});

router.post("/upload", authMiddleware, upload.single("pdfFile"), uploadEbook);

router.get("/download/:id", authMiddleware, downloadEbook);

router.get("/all", getAllEbooks);

module.exports = router;
