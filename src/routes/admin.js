const express = require("express");
const { assignAdminRole } = require("../controllers/admin");
const authMiddleware = require("../middleware/auth");
const isAdminMiddleware = require("../middleware/isAdmin");

const router = express.Router();

router.post(
  "/assign-admin",
  authMiddleware,
  isAdminMiddleware,
  assignAdminRole
);

module.exports = router;
