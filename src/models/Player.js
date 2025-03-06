const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema({
  name: String,
  email: String,
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
  score: Number,
  winner: { type: Boolean, default: false },
});

module.exports = mongoose.model("Player", PlayerSchema);
