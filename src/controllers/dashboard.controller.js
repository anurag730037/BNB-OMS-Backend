const Order = require("../models/order.model");
const Retailer = require("../models/retailer.model");
const Product = require("../models/product.model");

const getDashboardStats = async (req, res) => {
    try {
        const [statsResult, totalRetailers, totalProducts, recentOrders] = await Promise.all([
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalKg: { $sum: "$totalkg" },
                        pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                        approvedOrders: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
                        packedOrders: { $sum: { $cond: [{ $eq: ["$status", "packed"] }, 1, 0] } },
                        deliveredOrders: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } }
                    }
                }
            ]),
            Retailer.countDocuments(),
            Product.countDocuments(),
            Order.find()
                .populate("retailerId")
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        const orderStats = statsResult[0] || {
            totalKg: 0,
            pendingOrders: 0,
            approvedOrders: 0,
            packedOrders: 0,
            deliveredOrders: 0
        };

        return res.status(200).json({
            success: true,
            stats: {
                pendingOrders: orderStats.pendingOrders,
                approvedOrders: orderStats.approvedOrders,
                packedOrders: orderStats.packedOrders,
                deliveredOrders: orderStats.deliveredOrders,
                totalRetailers,
                totalProducts,
                totalKg: orderStats.totalKg
            },
            recentOrders
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getDashboardStats
};