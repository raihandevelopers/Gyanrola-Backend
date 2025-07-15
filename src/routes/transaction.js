const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  purchaseCoins,
  getWalletBalance,
  deductCoinsForQuiz,
  getTransactions
} = require("../controllers/Transaction");

// Fetch all withdrawal requests (admin only)
router.get("/", authMiddleware, getTransactions);

// Wallet/Coin routes
router.post("/wallet/purchase", authMiddleware, purchaseCoins);
router.get("/wallet/balance", authMiddleware, getWalletBalance);
router.post("/wallet/deduct", authMiddleware, deductCoinsForQuiz);

module.exports = router;
