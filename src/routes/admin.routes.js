const express = require("express");
console.log("Admin Routes Loaded");
const { registerAdmin, loginAdmin } = require("../controllers/admin.controller");
const { sendAdminNotification, getNotificationHistory } = require("../controllers/notification.controller");
const { updateBanners } = require("../controllers/banner.controller");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

// Get Notification History
router.get(
    "/notifications",
    protect,
    authorizeRoles("admin"),
    getNotificationHistory
);

// New Send Notification Route
router.post(
    "/notifications/send",
    protect,
    authorizeRoles("admin"),
    sendAdminNotification
);

// Update Banners Route (Admin Only)
router.put(
    "/banners",
    protect,
    authorizeRoles("admin"),
    updateBanners
);

module.exports = router;