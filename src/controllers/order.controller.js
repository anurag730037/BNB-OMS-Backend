const Order = require("../models/order.model");
const Retailer = require("../models/retailer.model");
const { broadcast } = require("../utils/websocket");

const createOrder = async (req, res) => {

    try {

        const { retailerId, items } = req.body;

        //Validation

        if (!retailerId || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "All Fields Are Required"
            })
        }

        //Calculate total kg
        let totalkg = 0;

        for (const item of items) {
            totalkg += item.quantityKg
        }

        //  Create Order

        const order = await Order.create({
            retailerId,
            items,
            totalkg
        })

        // Populate retailer details for the broadcast
        const populatedOrder = await Order.findById(order._id).populate("retailerId");

        // 📢 Broadcast a real-time event to all connected WebSocket clients (the Admins)

        broadcast({
            event: "NEW_ORDER",
            order: populatedOrder || order
        })

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order,
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }

}

const getAllOrders = async (req, res) => {
    try {
        // 1. Destructure areaId (or area) from the query parameters
        const { retailerId, status, search, startDate, endDate, areaId } = req.query;

        // Build a dynamic filter object for Orders
        const filter = {}

        if (status) {
            filter.status = status;
        }

        // 2. Combine all Retailer-based filters (ID, Search, and Area)
        if (retailerId || search || areaId) {
            const retailerFilter = {};

            if (retailerId) {
                retailerFilter._id = retailerId;
            }

            if (areaId) {
                retailerFilter.area = areaId; // Filter retailers by area
            }

            if (search) {
                retailerFilter.$or = [
                    { shopName: { $regex: search, $options: "i" } },
                    { ownerName: { $regex: search, $options: "i" } }
                ];

                // Fetch matching retailers
                const matchingRetailers = await Retailer.find(retailerFilter).select("_id");
                const matchingIds = matchingRetailers.map(r => r._id);

                // Match orderId OR retailerId
                filter.$or = [
                    { orderId: { $regex: search, $options: "i" } },
                    { retailerId: { $in: matchingIds } }
                ];
            } else {
                // Fetch matching retailers
                const matchingRetailers = await Retailer.find(retailerFilter).select("_id");
                const matchingIds = matchingRetailers.map(r => r._id);

                // Assign the list of matching retailer IDs to the order filter
                filter.retailerId = { $in: matchingIds };
            }
        }

        // 3. Date Range Filter
        if (startDate || endDate) {
            filter.createdAt = {};

            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        // 4. Execute query
        const orders = await Order.find(filter)
            .populate({
                path: "retailerId",
                populate: { path: "area" }
            })
            .populate({
                path: "items.productId",
                populate: {
                    path: "categoryId"
                }
            })
            .sort({ createdAt: -1 });

        // Calculate summary stats
        const [packingLoadStats, pendingCount, deliveredCount] = await Promise.all([
            Order.aggregate([
                { $match: { status: { $in: ["approved", "packed"] } } },
                { $group: { _id: null, totalKg: { $sum: "$totalkg" } } }
            ]),
            Order.countDocuments({ status: "pending" }),
            Order.countDocuments({
                status: "delivered",
                createdAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lte: new Date(new Date().setHours(23, 59, 59, 999))
                }
            })
        ]);

        const totalPackingLoad = packingLoadStats[0]?.totalKg || 0;

        return res.status(200).json({
            success: true,
            count: orders.length,
            orders,
            stats: {
                totalPackingLoad,
                pendingCount,
                deliveredCount
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "pending",
            "approved",
            "packed",
            "delivered",
            "cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });
        }

        const order = await Order.findByIdAndUpdate(orderId,
            { status }, { new: true }
        )

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Order status updated",
            order
        });

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const editOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { items, adminNote } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Order items required"
            });
        }

        let totalkg = 0;

        for (const item of items) {
            totalkg += item.quantityKg;
        }

        const order = await Order.findByIdAndUpdate(orderId, {
            items,
            totalkg,
            adminNote
        }, { new: true })

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Order updated successfully",
            order
        });


    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const getPendingOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            status: "pending"
        })
            .populate("retailerId")
            .populate({
                path: "items.productId",
                populate: {
                    path: "categoryId"
                }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getRetailerOrders = async (req, res) => {
    try {
        const retailerId = req.user.userId;

        const orders = await Order.find({ retailerId })
            .populate({
                path: "items.productId",
                populate: {
                    path: "categoryId"
                }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }

}

const getAdminOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;

        const query = {
            $or: [
                { orderId: orderId }
            ]
        };

        if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({ _id: orderId });
        }

        const order = await Order.findOne(query)
            .populate("retailerId")
            .populate({
                path: "items.productId",
                populate: {
                    path: "categoryId"
                }
            });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.status(200).json({
            success: true,
            order
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const getRetailerOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const loggedInUserId = req.user.userId;

        const query = {
            $or: [
                { orderId: orderId }
            ]
        };

        if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
            query.$or.push({ _id: orderId });
        }

        const order = await Order.findOne(query)
            .populate("retailerId")
            .populate({
                path: "items.productId",
                populate: {
                    path: "categoryId"
                }
            });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Validate that this order belongs to the logged-in retailer
        if (!order.retailerId || order.retailerId._id.toString() !== loggedInUserId) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this order"
            });
        }

        // Convert order to object and remove adminNote
        const orderData = order.toObject();
        // delete orderData.adminNote;

        return res.status(200).json({
            success: true,
            order: orderData
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    createOrder,
    getAllOrders,
    updateOrderStatus,
    getPendingOrders,
    getRetailerOrders,
    getAdminOrderDetails,
    getRetailerOrderDetails,
    editOrder
};