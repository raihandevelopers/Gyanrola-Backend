const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Withdrawal = require("../models/Withdrawal");

const minimum_redemption_value = 500;

// Register
exports.register = async (req, res) => {
  const { name, email, password, refer_code } = req.body; // Add name to the request body
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if refer_code is valid
    let referredBy = null;
    if (refer_code) {
      try {
        const referrer = await User.findOne({ _id: refer_code });
        if (!referrer) {
          return res.status(400).json({ error: "Invalid referral code" });
        }
        referredBy = referrer._id;
      } catch (error) {
        return res.status(400).json({ error: "Invalid referral code" });
      }
    }

    // Create user (default role is "user")
    const user = new User({
      name,
      email,
      password: hashedPassword,
      referredBy,
    }); // Include referredBy

    await user.save();
    // Add 50 rs to user wallet for successful referral
    if (referredBy) {
      const referrer = await User.findById(referredBy);
      if (referrer) {
        referrer.wallet += 50; // Add 50 rs to referrer's wallet

        await referrer.save();
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ message: "User registered successfully", token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  const userId = req.params.id; // Get user ID from request parameters
  try {
    const user = await User.findById(userId); // Include wallet field
    const userReferrals = await User.find(
      { referredBy: userId },
      { email: 1, name: 1, _id: 0 }
    );
    res.json({ user, userReferrals });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Admin Login
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });
    if (user.role !== "admin")
      return res.status(403).json({
        error: "Access denied! You need to be an admin to perform this action.",
      });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    // Fetch all users (only email and name)
    const users = await User.find(
      {},
      { email: 1, name: 1, wallet: 1, referredBy: 1 }
    );
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId, {
      email: 1,
      name: 1,
      wallet: 1,
      purchases: 1,
    }); // Include wallet field
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.redeem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    // Check if the user has sufficient balance
    const user = await User.findById(userId);
    if (user.wallet < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    // Check minimum redemption value
    if (amount < minimum_redemption_value) {
      return res.status(400).json({
        error: `Minimum redemption value is ${minimum_redemption_value}`,
      });
    }

    // Create a withdrawal request
    const withdrawal = new Withdrawal({ userId, amount });
    await withdrawal.save();

    res.json({ message: "Withdrawal request submitted", withdrawal });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getUserReferrals = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming req.user.id contains the ID of the logged-in user
    // Find all users referred by this user
    const referrals = await User.find(
      { referredBy: userId },
      { email: 1, name: 1, _id: 0 }
    );
    res.json(referrals);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
