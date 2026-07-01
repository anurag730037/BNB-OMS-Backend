const Order = require("../models/order.model");
const Retailer = require("../models/retailer.model");
const Product = require("../models/product.model");
const Area = require("../models/area.model");

// 1. Overview Stats: totalOrders, pendingOrders, activeRetailers, deliveredKg, totalProducts, avgWeight
const getOverviewStats = async (req, res) => {
    try {
        const [statsResult, totalRetailers, totalProducts] = await Promise.all([
            Order.aggregate([
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalKg: { $sum: "$totalkg" },
                        pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                        deliveredKg: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, "$totalkg", 0] } }
                    }
                }
            ]),
            Retailer.countDocuments({ isActive: true }),
            Product.countDocuments()
        ]);

        const orderStats = statsResult[0] || { totalOrders: 0, totalKg: 0, pendingOrders: 0, deliveredKg: 0 };
        const totalOrdersCount = orderStats.totalOrders || 1;

        return res.status(200).json({
            success: true,
            stats: {
                totalOrders: orderStats.totalOrders,
                pendingOrders: orderStats.pendingOrders,
                activeRetailers: totalRetailers,
                deliveredKg: orderStats.deliveredKg,
                totalProducts,
                avgWeight: totalOrdersCount > 0 ? (orderStats.totalKg / totalOrdersCount).toFixed(1) : 0
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Status Ratios: breakdown of order statuses with percentages
const getStatusRatios = async (req, res) => {
    try {
        const statsResult = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                    approvedOrders: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
                    packedOrders: { $sum: { $cond: [{ $eq: ["$status", "packed"] }, 1, 0] } },
                    deliveredOrders: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } }
                }
            }
        ]);

        const orderStats = statsResult[0] || { totalOrders: 0, pendingOrders: 0, approvedOrders: 0, packedOrders: 0, deliveredOrders: 0 };
        const totalOrdersCount = orderStats.totalOrders || 1;

        const statusRatios = [
            { label: "Pending", count: orderStats.pendingOrders, percent: Math.round((orderStats.pendingOrders / totalOrdersCount) * 100), color: "bg-amber-500" },
            { label: "Approved", count: orderStats.approvedOrders, percent: Math.round((orderStats.approvedOrders / totalOrdersCount) * 100), color: "bg-blue-500" },
            { label: "Packed", count: orderStats.packedOrders, percent: Math.round((orderStats.packedOrders / totalOrdersCount) * 100), color: "bg-purple-500" },
            { label: "Delivered", count: orderStats.deliveredOrders, percent: Math.round((orderStats.deliveredOrders / totalOrdersCount) * 100), color: "bg-green-500" }
        ];

        return res.status(200).json({ success: true, statusRatios });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Recent Orders + Pending Orders List
const getRecentOrders = async (req, res) => {
    try {
        const [recentOrders, pendingOrdersList] = await Promise.all([
            Order.find()
                .populate("retailerId")
                .sort({ createdAt: -1 })
                .limit(5),
            Order.find({ status: "pending" })
                .populate("retailerId")
                .sort({ createdAt: -1 })
        ]);

        return res.status(200).json({ success: true, recentOrders, pendingOrdersList });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Business Reports: today/week/month/year stats
const getBusinessReports = async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        const monthStart = new Date();
        monthStart.setDate(monthStart.getDate() - 30);

        const yearStart = new Date();
        yearStart.setDate(yearStart.getDate() - 365);

        const getStatsForRange = (startDate) => {
            return Order.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        totalKg: { $sum: "$totalkg" },
                        deliveredKg: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, "$totalkg", 0] } }
                    }
                }
            ]).then(res => res[0] || { count: 0, totalKg: 0, deliveredKg: 0 });
        };

        const [reportToday, reportWeek, reportMonth, reportYear] = await Promise.all([
            getStatsForRange(todayStart),
            getStatsForRange(weekStart),
            getStatsForRange(monthStart),
            getStatsForRange(yearStart)
        ]);

        return res.status(200).json({
            success: true,
            reports: {
                today: reportToday,
                week: reportWeek,
                month: reportMonth,
                year: reportYear
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Top Regions Distribution
const getTopRegions = async (req, res) => {
    try {
        const topRegionsResult = await Order.aggregate([
            {
                $group: {
                    _id: "$retailerId",
                    orderCount: { $sum: 1 },
                    totalKg: { $sum: "$totalkg" }
                }
            },
            {
                $lookup: {
                    from: "retailers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "retailer"
                }
            },
            { $unwind: "$retailer" },
            {
                $group: {
                    _id: "$retailer.area",
                    retailerCount: { $addToSet: "$retailer._id" },
                    orders: { $sum: "$orderCount" },
                    totalKg: { $sum: "$totalKg" }
                }
            },
            {
                $lookup: {
                    from: "areas",
                    localField: "_id",
                    foreignField: "_id",
                    as: "areaInfo"
                }
            },
            { $unwind: { path: "$areaInfo", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    name: { $ifNull: ["$areaInfo.name", "Unknown Area"] },
                    retailers: { $size: "$retailerCount" },
                    orders: 1,
                    totalKg: 1
                }
            },
            { $sort: { orders: -1 } },
            { $limit: 5 }
        ]);

        return res.status(200).json({ success: true, topRegions: topRegionsResult });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 6. Operational Insights: dormantRetailers + lowStockAlerts + areaPackingLoads
const getOperationalInsights = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [activeOrderedProducts, activeRetailersList, orderSummaryByRetailer, areaPackingLoads] = await Promise.all([
            // Low stock alerts: products in pending/approved orders that are unavailable
            Order.aggregate([
                { $match: { status: { $in: ["pending", "approved"] } } },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.productId",
                        totalWeight: { $sum: "$items.quantityKg" }
                    }
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "_id",
                        as: "product"
                    }
                },
                { $unwind: "$product" },
                { $match: { "product.isAvailable": false } },
                {
                    $project: {
                        name: "$product.name",
                        totalWeight: 1
                    }
                }
            ]),
            // Active retailers for dormant calculation
            Retailer.find({ isActive: true }).select("shopName ownerName phone"),
            // Order summary by retailer for dormant calculation
            Order.aggregate([
                {
                    $group: {
                        _id: "$retailerId",
                        lastOrderDate: { $max: "$createdAt" }
                    }
                }
            ]),
            // Logistics packing/dispatch load by area (approved/packed orders)
            Order.aggregate([
                { $match: { status: { $in: ["approved", "packed"] } } },
                {
                    $lookup: {
                        from: "retailers",
                        localField: "retailerId",
                        foreignField: "_id",
                        as: "retailer"
                    }
                },
                { $unwind: "$retailer" },
                {
                    $group: {
                        _id: "$retailer.area",
                        totalKg: { $sum: "$totalkg" },
                        ordersCount: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: "areas",
                        localField: "_id",
                        foreignField: "_id",
                        as: "areaInfo"
                    }
                },
                { $unwind: { path: "$areaInfo", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        name: { $ifNull: ["$areaInfo.name", "Unknown Area"] },
                        totalKg: 1,
                        ordersCount: 1
                    }
                },
                { $sort: { totalKg: -1 } }
            ])
        ]);

        // Formulate dormant retailers
        const orderDatesMap = {};
        orderSummaryByRetailer.forEach(o => {
            if (o._id) {
                orderDatesMap[o._id.toString()] = o.lastOrderDate;
            }
        });

        const dormantRetailers = activeRetailersList
            .map(r => {
                const lastOrderDate = orderDatesMap[r._id.toString()];
                return {
                    _id: r._id,
                    shopName: r.shopName,
                    ownerName: r.ownerName,
                    phone: r.phone,
                    lastOrderDate: lastOrderDate || null,
                    daysInactive: lastOrderDate 
                        ? Math.floor((new Date() - new Date(lastOrderDate)) / (1000 * 60 * 60 * 24)) 
                        : null
                };
            })
            .filter(r => r.lastOrderDate === null || r.lastOrderDate < sevenDaysAgo)
            .sort((a, b) => {
                if (a.lastOrderDate === null && b.lastOrderDate !== null) return -1;
                if (a.lastOrderDate !== null && b.lastOrderDate === null) return 1;
                if (a.lastOrderDate === null && b.lastOrderDate === null) return 0;
                return new Date(a.lastOrderDate) - new Date(b.lastOrderDate);
            })
            .slice(0, 5);

        return res.status(200).json({
            success: true,
            dormantRetailers,
            lowStockAlerts: activeOrderedProducts,
            areaPackingLoads
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 7. Top Products (delivered in last 30 days)
const getTopProducts = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const topProducts = await Order.aggregate([
            { 
                $match: { 
                    status: "delivered",
                    createdAt: { $gte: thirtyDaysAgo } 
                } 
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    totalKg: { $sum: "$items.quantityKg" }
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            {
                $project: {
                    name: "$product.name",
                    totalKg: 1
                }
            },
            { $sort: { totalKg: -1 } },
            { $limit: 5 }
        ]);

        return res.status(200).json({ success: true, topProducts });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getOverviewStats,
    getStatusRatios,
    getRecentOrders,
    getBusinessReports,
    getTopRegions,
    getOperationalInsights,
    getTopProducts
};