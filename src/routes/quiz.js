const express = require("express");
const { createQuiz, getQuizzes, deleteQuiz, getQuizById ,  updateQuiz, // Import the new function
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


module.exports = router;