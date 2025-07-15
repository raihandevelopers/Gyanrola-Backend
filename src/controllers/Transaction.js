const Transaction = require("../models/Transaction");
const User = require("../models/User");

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("userId", "name email")
      .populate("ebookId", "title")
      .populate("quizId", "title");
    res.json(transactions);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Purchase coins: add coins to user's wallet after payment verification
exports.purchaseCoins = async (req, res) => {
  console.log("[purchaseCoins] body:", req.body, "user:", req.user && req.user.id);
  const { coins } = req.body;
  if (!coins || coins <= 0) {
    return res.status(400).json({ error: "Invalid coin amount" });
  }
  try {
    // This should be called after payment gateway success
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { wallet: coins } },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ wallet: user.wallet });
  } catch (err) {
    console.error("[purchaseCoins] error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get wallet balance
exports.getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ wallet: user.wallet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Deduct coins for quiz play
exports.deductCoinsForQuiz = async (req, res) => {
  console.log("[deductCoinsForQuiz] body:", req.body, "user:", req.user && req.user.id);
  const { quizId, amount } = req.body;
  if (!quizId || !amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid request" });
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.wallet < amount) {
      return res.status(400).json({ error: "Insufficient wallet balance" });
    }
    // Atomic update to deduct coins
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { wallet: -amount } },
      { new: true }
    );
    // Optionally, add quizId to purchases/quizzes here
    res.json({ wallet: updatedUser.wallet });
  } catch (err) {
    console.error("[deductCoinsForQuiz] error:", err);
    res.status(500).json({ error: err.message });
  }
};
