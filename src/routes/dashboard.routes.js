const express = require("express");
const { getDashboardStats } = require("../controllers/dashboard.controller");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/stats", protect, authorizeRoles("admin"), getDashboardStats);

module.exports = router;