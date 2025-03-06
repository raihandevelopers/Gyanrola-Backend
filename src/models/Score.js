const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  score: { type: Number, required: true },
  selectedOptions: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Reference to the question
      selectedAnswer: { type: String, required: true }, // User's selected answer
    },
  ],
  isWinner: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Score", scoreSchema);