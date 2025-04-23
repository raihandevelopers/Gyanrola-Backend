const express = require("express");
const {
  createQuiz,
  getQuizzes,
  getAllQuizzes, // Import Quizzes without filter
  deleteQuiz,
  getQuizById,
  updateQuiz,
  createQuizOrder,
  verifyPayment,
} = require("../controllers/quiz"); // Import deleteQuiz
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Create Quiz
router.post("/", authMiddleware, createQuiz);

// Get All Quizzes
router.get("/", getQuizzes);
router.get("/all", getAllQuizzes); // Get all quizzes without filter
router.get("/:id", authMiddleware, getQuizById);

// Delete Quiz
router.delete("/:id", authMiddleware, deleteQuiz); // Add delete route

router.put("/:id", authMiddleware, updateQuiz);

// Create Order for ebook
router.post("/order", authMiddleware, createQuizOrder);

// Verify Order Payment
router.get("/verify/:id", verifyPayment);

module.exports = router;
