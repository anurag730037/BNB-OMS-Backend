const express = require("express");
console.log("Admin Routes Loaded");
const { registerAdmin, loginAdmin } = require("../controllers/admin.controller");
const { sendAdminNotification } = require("../controllers/notification.controller");
const { updateBanners } = require("../controllers/banner.controller");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

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