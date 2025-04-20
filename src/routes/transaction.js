const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/Transaction");
const authMiddleware = require("../middleware/auth");

// Fetch all withdrawal requests (admin only)
router.get("/", authMiddleware, transactionController.getTransactions);

module.exports = router;
