const express = require("express");
const router = express.Router();
const withdrawalController = require("../controllers/Withdrawal");
const authMiddleware = require("../middleware/auth");

// Submit a withdrawal request
router.post("/request", authMiddleware, withdrawalController.requestWithdrawal);

// Fetch all withdrawal requests (admin only)
router.get("/", authMiddleware, withdrawalController.getWithdrawals);

// Fetch all withdrawal requests for a user
router.get("/user", authMiddleware, withdrawalController.getUserWithdrawals);

// Accept a withdrawal request (admin only)
router.put(
  "/:id/accept",
  authMiddleware,
  withdrawalController.acceptWithdrawal
);

// Reject a withdrawal request (admin only)
router.put(
  "/:id/reject",
  authMiddleware,
  withdrawalController.rejectWithdrawal
);

module.exports = router;
