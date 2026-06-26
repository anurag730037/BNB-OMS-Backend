const express = require("express");
console.log("Admin Routes Loaded");
const { registerAdmin, loginAdmin } = require("../controllers/admin.controller");
const { authorizeRoles, protect } = require("../middlewares/authMiddleware");
const { getAllOrders, getPendingOrders, editOrder, updateOrderStatus } = require("../controllers/order.controller");
const { getAllRetailers } = require("../controllers/retailer.controller");

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

// Admin gets all retailers
router.get(
    "/all-retailers",
    protect,
    authorizeRoles("admin"),
    getAllRetailers
)

// Admin gets all orders
router.get(
    "/order/all",
    protect,
    authorizeRoles("admin"),
    getAllOrders
);

// Admin gets all pending orders
router.get(
    "/order/pending",
    protect,
    authorizeRoles("admin"),
    getPendingOrders
);

// Admin edits order before approval
router.put(
    "/order/edit/:orderId",
    protect,
    authorizeRoles("admin"),
    editOrder
);

// Admin updates status
router.patch(
    "/order/status/:orderId",
    protect,
    authorizeRoles("admin"),
    updateOrderStatus
);
module.exports = router;