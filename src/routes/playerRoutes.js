const express = require("express");
const { submitQuiz, getPlayersByQuiz, declareWinner } = require("../controllers/playerController");
const router = express.Router();

router.post("/", submitQuiz);
router.get("/:quizId", getPlayersByQuiz);
router.put("/winner/:playerId", declareWinner);

module.exports = router;
