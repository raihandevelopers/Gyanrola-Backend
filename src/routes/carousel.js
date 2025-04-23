const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const {
  getCarouselImages,
  uploadCarouselImage,
  editCarouselImage,
  deleteCarouselImage,
  getCarouselImage,
} = require("../controllers/Carousel");
const authMiddleware = require("../middleware/auth");

// Configure storage for carousel images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/carouselImages/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Filter to accept only image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});

// Get all carousel images
router.get("/", getCarouselImages);

// Upload a new carousel image
router.post("/", authMiddleware, upload.single("image"), uploadCarouselImage);

// Edit an existing carousel image
router.put("/:id", authMiddleware, upload.single("image"), editCarouselImage);

// Delete a carousel image
router.delete("/:id", authMiddleware, deleteCarouselImage);

// Download carousel image
router.get("/download/:id", getCarouselImage);

module.exports = router;
