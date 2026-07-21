const express = require("express");
const { getSupportInfo, updateSupportInfo } = require("../controllers/support.controller");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

// Get Support Info (Public / Logged-in users)
router.get("/", getSupportInfo);

// Update Support Info (Admin only)
router.put("/", protect, authorizeRoles("admin"), updateSupportInfo);

module.exports = router;
