const express = require("express");
const {
  createQuiz,
  getQuizzes,
  deleteQuiz,
  getQuizById,
  updateQuiz,
  createQuizOrder,
  verifyPayment, // Import the new function
} = require("../controllers/quiz"); // Import deleteQuiz
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Create Quiz
router.post("/", authMiddleware, createQuiz);

// Get All Quizzes
router.get("/", getQuizzes);
router.get("/:id", getQuizById);

// Delete Quiz
router.delete("/:id", authMiddleware, deleteQuiz); // Add delete route

router.put("/:id", authMiddleware, updateQuiz);

// Create Order for ebook
router.post("/order", authMiddleware, createQuizOrder);

// Verify Order Payment
router.get("/verify/:id", verifyPayment);

module.exports = router;
