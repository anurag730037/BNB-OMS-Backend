const express = require("express");
const { 
    createOrder, 
    getAllOrders, 
    editOrder, 
    updateOrderStatus, 
    getPendingOrders, 
    getRetailerOrders, 
    getAdminOrderDetails,
    getRetailerOrderDetails
} = require("../controllers/order.controller");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

// --- Retailer Routes ---
// Retailer creates order
router.post(
    "/create",
    protect,
    authorizeRoles("retailer"),
    createOrder
);

// Retailer gets their own orders
router.get(
    "/my-orders",
    protect,
    authorizeRoles("retailer"),
    getRetailerOrders
);

// --- Admin Routes ---
// Admin gets all orders
router.get(
    "/",
    protect,
    authorizeRoles("admin"),
    getAllOrders
);

// Admin gets all pending orders
router.get(
    "/pending",
    protect,
    authorizeRoles("admin"),
    getPendingOrders
);

// Admin edits order before approval
router.put(
    "/edit/:orderId",
    protect,
    authorizeRoles("admin"),
    editOrder
);

// Admin updates status
router.patch(
    "/status/:orderId",
    protect,
    authorizeRoles("admin"),
    updateOrderStatus
);

// --- Admin Specific Routes ---
// Admin gets single order details
router.get(
    "/admin/:orderId",
    protect,
    authorizeRoles("admin"),
    getAdminOrderDetails
);

// --- Retailer Specific Routes ---
// Retailer gets single order details
router.get(
    "/retailer/:orderId",
    protect,
    authorizeRoles("retailer"),
    getRetailerOrderDetails
);

module.exports = router;