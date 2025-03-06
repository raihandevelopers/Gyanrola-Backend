const Player = require("../models/Player");

exports.submitQuiz = async (req, res) => {
  const { name, email, quizId, score } = req.body;
  const player = new Player({ name, email, quiz: quizId, score });
  await player.save();
  res.status(201).json({ message: "Quiz submitted successfully!" });
};

exports.getPlayersByQuiz = async (req, res) => {
  const players = await Player.find({ quiz: req.params.quizId });
  res.json(players);
};

exports.declareWinner = async (req, res) => {
  const player = await Player.findById(req.params.playerId);
  if (!player) return res.status(404).json({ error: "Player not found" });

  player.winner = true;
  await player.save();
  res.json({ message: "Winner declared!" });
};
