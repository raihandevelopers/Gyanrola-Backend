const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const {
  uploadEbook,
  downloadEbook,
  getAllEbooks,
  getEbookById,
  updateEbook,
  deleteEbook,
  getEbookCoverImage,
  createEbookOrder,
  verifyPayment,
} = require("../controllers/Ebooks");
const authMiddleware = require("../middleware/auth");

// Configure storage
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Create - Upload new ebook
router.post("/", authMiddleware, upload.single("pdfFile"), uploadEbook);

// Read - Get all ebooks
router.get("/", getAllEbooks);

// Read - Get single ebook
router.get("/:id", getEbookById);

// Update - Modify existing ebook
router.put("/:id", authMiddleware, upload.single("pdfFile"), updateEbook);

// Delete - Remove ebook
router.delete("/:id", authMiddleware, deleteEbook);

// Download ebook file
router.get("/download/:id", authMiddleware, downloadEbook);

// Get ebook cover image
router.get("/cover/:id", getEbookCoverImage);

// Create Order for ebook
router.post("/order", authMiddleware, createEbookOrder);

// Verify Order Payment
router.get("/verify/:id", verifyPayment);

module.exports = router;
