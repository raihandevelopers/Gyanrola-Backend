const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User");

// Submit a withdrawal request
exports.requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, upi } = req.body;

    if (!upi) {
      return res.status(400).json({ error: "UPI is required" });
    }

    // Check if the user has sufficient balance
    const user = await User.findById(userId);
    if (user.wallet < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    // Create a withdrawal request
    const withdrawal = new Withdrawal({ userId, amount, upi });
    await withdrawal.save();

    res
      .status(201)
      .json({ message: "Withdrawal request submitted", withdrawal });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getUserWithdrawals = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Fetching all withdrawal requests for user:", userId);
    const withdrawals = await Withdrawal.find({ userId }) // Filter by userId
      .populate("userId", "name email") // Populate userId with name and email
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .select("userId amount createdAt status"); // Include status in the response
    console.log("Withdrawals:", withdrawals);
    res.json(withdrawals);
  } catch (err) {
    console.error("Error fetching withdrawals:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Fetch all withdrawal requests
exports.getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find() // Filter by userId
      .populate("userId", "name email wallet") // Populate userId with name and email
      .sort({ createdAt: -1 }) // Sort by createdAt in descending order
      .select("userId amount createdAt status"); // Include status in the response
    console.log("Withdrawals:", withdrawals);
    res.json(withdrawals);
  } catch (err) {
    console.error("Error fetching withdrawals:", err);
    res.status(500).json({ error: "Server error" });
  }
};
// Accept a withdrawal request
exports.acceptWithdrawal = async (req, res) => {
  try {
    const withdrawalId = req.params.id;

    // Find the withdrawal request
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal request not found" });
    }

    // Check if the request is already processed
    if (withdrawal.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Withdrawal request already processed" });
    }

    // Deduct the amount from the user's wallet
    const user = await User.findById(withdrawal.userId);
    if (user.wallet < withdrawal.amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }
    user.wallet -= withdrawal.amount;
    await user.save();

    // Update the withdrawal status
    withdrawal.status = "accepted";
    await withdrawal.save();

    res.json({ message: "Withdrawal request accepted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Reject a withdrawal request
exports.rejectWithdrawal = async (req, res) => {
  try {
    const withdrawalId = req.params.id;

    // Find the withdrawal request
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal request not found" });
    }

    // Check if the request is already processed
    if (withdrawal.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Withdrawal request already processed" });
    }

    // Update the withdrawal status
    withdrawal.status = "rejected";
    await withdrawal.save();

    res.json({ message: "Withdrawal request rejected" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
