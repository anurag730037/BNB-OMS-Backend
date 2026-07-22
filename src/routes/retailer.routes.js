const express = require("express");
const { registerRetailer, loginRetailer, getSingleRetailer, getAllRetailers, toggleRetailerStatus, updateRetailer, changePassword, adminResetRetailerPassword, updateDeviceToken } = require("../controllers/retailer.controller");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

// Only logged-in admin can register a new retailer
router.post("/register", protect, authorizeRoles("admin"), registerRetailer);

// Public route for retailers to log in
router.post("/login", loginRetailer);

// Protected route for retailers to register/update device FCM token
router.post("/device-token", protect, updateDeviceToken);

// Change password by logged-in retailer
router.patch("/change-password", protect, changePassword);

// Retailer update by admin
router.put("/:retailerId",
    protect,
    authorizeRoles("admin"),
    updateRetailer
);

// Toggle Retailer Status by admin
router.patch("/:retailerId/toggle-status",
    protect,
    authorizeRoles("admin"),
    toggleRetailerStatus
);

// Admin Reset Retailer Password (No old password required)
router.patch("/:retailerId/reset-password",
    protect,
    authorizeRoles("admin"),
    adminResetRetailerPassword
);

// Get all retailers by admin
router.get(
    "/",
    protect,
    authorizeRoles("admin"),
    getAllRetailers
);

// Get single retailer 
router.get(
    "/:retailerId",
    protect,
    getSingleRetailer
);

module.exports = router;