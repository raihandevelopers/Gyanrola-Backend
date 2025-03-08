const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  points: { type: Number, default: 0 }, // Add points field
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Add referredBy field
  wallet: { type: Number, default: 0 }, // Add wallet field
});

module.exports = mongoose.model("User", userSchema);
