const express = require("express");
const { createOrder, getAllOrders, editOrder, updateOrderStatus, getPendingOrders, getRetailerOrders, getSingleOrderDetails } = require("../controllers/order.controller");
const router = express.Router();

const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

// Retailer creates order
router.post(
    "/create",
    protect,
    authorizeRoles("retailer"),
    createOrder
);

//Retailer gets his orders
router.get(
    "/my-orders",
    protect,
    authorizeRoles("retailer"),
    getRetailerOrders
);

// Retailer gets single order details
router.get(
    "/:orderId",
    protect,
    getSingleOrderDetails
);



module.exports = router;