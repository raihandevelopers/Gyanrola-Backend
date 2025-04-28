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
  getQuizByIdAdmin,
  createMultipleQuizzes, // Import createMultipleQuizzes
} = require("../controllers/quiz"); // Import deleteQuiz
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/isAdmin");

const router = express.Router();

// Create Quiz
router.post("/", authMiddleware, createQuiz);

// Get All Quizzes
router.get("/", getQuizzes);
router.get("/all", getAllQuizzes); // Get all quizzes without filter
router.get("/:id", authMiddleware, getQuizById);
router.get("/getQuiz/:id", authMiddleware, adminMiddleware, getQuizByIdAdmin); // Get quiz by ID

// Delete Quiz
router.delete("/:id", authMiddleware, deleteQuiz); // Add delete route

router.put("/:id", authMiddleware, updateQuiz);

// Create Order for ebook
router.post("/order", authMiddleware, createQuizOrder);

// Verify Order Payment
router.get("/verify/:id", verifyPayment);

// Create Multiple Quizzes
router.post("/bulk", authMiddleware, createMultipleQuizzes);

module.exports = router;
