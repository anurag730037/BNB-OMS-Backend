const Order = require("../models/order.model");


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
        const orders = await Order.find()
            .populate("retailerId")
            .populate("items.productId").
            sort({ createdAt: -1 })

        return res.status(200).json({
            success: true,
            orders
        })
    }
    catch (error) {
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
            .populate("items.productId")
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

        const orders = await Order.find({ retailerId }).populate("items.productId").sort({ createdAt: -1 });

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

const getSingleOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId).populate("retailerId").populate("items.productId");

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

module.exports = {
    createOrder,
    getAllOrders,
    updateOrderStatus,
    getPendingOrders,
    getRetailerOrders,
    getSingleOrderDetails,
    editOrder
};