const express = require("express");
const { assignAdminRole } = require("../controllers/admin");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/assign-admin", authMiddleware, assignAdminRole);

module.exports = router;