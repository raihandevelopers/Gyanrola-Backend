const express = require("express");
const {
  register,
  login,
  getUsers,
  getUser,
  redeem,
} = require("../controllers/auth");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/users", getUsers);
router.get("/profile", authMiddleware, getUser);
router.post("/redeem", authMiddleware, redeem);
module.exports = router;
