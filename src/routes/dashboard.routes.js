const express = require("express");
const {
    getOverviewStats,
    getStatusRatios,
    getRecentOrders,
    getBusinessReports,
    getTopRegions,
    getOperationalInsights,
    getTopProducts
} = require("../controllers/dashboard.controller");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/overview", protect, authorizeRoles("admin"), getOverviewStats);
router.get("/status-ratios", protect, authorizeRoles("admin"), getStatusRatios);
router.get("/recent-orders", protect, authorizeRoles("admin"), getRecentOrders);
router.get("/reports", protect, authorizeRoles("admin"), getBusinessReports);
router.get("/top-regions", protect, authorizeRoles("admin"), getTopRegions);
router.get("/insights", protect, authorizeRoles("admin"), getOperationalInsights);
router.get("/top-products", protect, authorizeRoles("admin"), getTopProducts);

module.exports = router;