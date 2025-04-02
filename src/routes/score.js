const express = require("express");
const router = express.Router();
const {
  submitScore,
  declareWinner,
  getScoresForQuiz,
  removeWinner,
} = require("../controllers/score");
const authMiddleware = require("../middleware/auth");

// Submit Score
router.post("/submit", authMiddleware, submitScore);

// Declare Winner (Admin Only)
router.post("/declare-winner", authMiddleware, declareWinner);

// Remove Winner (Admin Only)
router.post("/remove-winner", authMiddleware, removeWinner);

// Get Scores for a Quiz
router.get("/quiz/:quizId", authMiddleware, getScoresForQuiz);

module.exports = router;
