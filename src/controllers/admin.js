const User = require("../models/User");

// Assign Admin Role
exports.assignAdminRole = async (req, res) => {
  const { userId } = req.body;

  try {
    // Check if the requester is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied! Only admins can assign roles." });
    }

    // Find the user and update their role
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.role = "admin";
    await user.save();

    res.json({ message: "Admin role assigned successfully", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};