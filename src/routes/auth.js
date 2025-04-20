const express = require("express");
const {
  register,
  login,
  getUsers,
  getUser,
  redeem,
  getUserReferrals,
  adminLogin,
  getUserById,
} = require("../controllers/auth");
const authMiddleware = require("../middleware/auth");
const isAdminMiddleware = require("../middleware/isAdmin");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/admin-login", adminLogin); // Admin login route
router.get("/getUser/:id", authMiddleware, isAdminMiddleware, getUserById); // Fetch user details
router.get("/users", getUsers);
router.get("/profile", authMiddleware, getUser);
router.post("/redeem", authMiddleware, redeem);
router.get("/referrals", authMiddleware, getUserReferrals); // Assuming you want to fetch referrals for the logged-in user
module.exports = router;
