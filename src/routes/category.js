const express = require("express");
const {
  createCategory,
  createSubcategory,
  getCategories, // Add this function
} = require("../controllers/category");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Create a new category (Admin only)
router.post("/", authMiddleware, createCategory);
// Create a new subcategory (Admin only)
router.post("/subcategory", authMiddleware, createSubcategory);

// Fetch all categories (Public or Admin, depending on your requirements)
router.get("/categories", getCategories); // Add this route

module.exports = router;