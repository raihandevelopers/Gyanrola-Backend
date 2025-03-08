const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7h" }
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
      { expiresIn: "7h" }
    );
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    // Fetch all users (only email and name)
    const users = await User.find({}, { email: 1, name: 1, _id: 0 }); // Only include email and name
    res.json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
