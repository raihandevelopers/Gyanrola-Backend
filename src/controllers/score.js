const Score = require("../models/Score");
const User = require("../models/User");
const Quiz = require("../models/Quiz");

// Submit Score
exports.submitScore = async (req, res) => {
  const { quizId, selectedOptions } = req.body; // selectedOptions: [{ questionId, selectedAnswer }]
  try {
    // Fetch the quiz to get the correct answers
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Calculate the score
    let score = 0;
    const userResponses = selectedOptions.map((userOption) => {
      const question = quiz.questions.find((q) =>
        q._id.equals(userOption.questionId)
      );
      if (!question) {
        throw new Error(`Question with ID ${userOption.questionId} not found`);
      }

      // Check if the selected answer is correct
      if (userOption.selectedAnswer === question.correctAnswer) {
        score += 4; // Increment score for each correct answer
      } else {
        score -= 1; // Decrement score for each wrong answer
      }

      return {
        questionId: userOption.questionId,
        selectedAnswer: userOption.selectedAnswer,
      };
    });

    // Save the score and selected options
    const newScore = new Score({
      user: req.user.id,
      quiz: quizId,
      score, // Ensure the score is set here
      selectedOptions: userResponses,
    });
    await newScore.save(); // This will work because the function is async

    res.status(201).json(newScore);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}; // Get Scores for a Quiz
exports.getScoresForQuiz = async (req, res) => {
  const { quizId } = req.params;
  try {
    const scores = await Score.find({ quiz: quizId })
      .populate("user", "name email")
      .sort({ isWinner: -1, score: -1 });

    res.json(scores);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Declare Winner (Admin Only)
exports.declareWinner = async (req, res) => {
  const { scoreId } = req.body;
  try {
    const score = await Score.findById(scoreId).populate("user");
    if (!score) return res.status(404).json({ error: "Score not found" });

    // Declare the user as the winner
    score.isWinner = true;
    await score.save();

    // Update the user's points
    const user = await User.findById(score.user._id);
    user.points += 10; // Add 10 points for winning
    await user.save();

    res.json({ message: "Winner declared successfully", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
