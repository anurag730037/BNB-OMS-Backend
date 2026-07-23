const Notification = require("../models/notification.model");
const Retailer = require("../models/retailer.model");
const Order = require("../models/order.model");
const notificationService = require("./notification.service");


/**
 * Helper to log system notification history in the DB
 */
const logSystemNotification = async ({ title, body, image, targetType, receiverCount, failedCount, area, retailer, selectedRetailers, inactiveDays, firebaseResponse }) => {

    try {
        await Notification.create({
            title,
            body,
            image: image || "",
            targetType,
            receiverCount,
            failedCount,
            sentBy: null, // null denotes system-generated
            area,
            retailer,
            selectedRetailers,
            inactiveDays,
            status: receiverCount > 0 ? "sent" : "failed",
            firebaseResponse
        })
    } catch (error) {
        console.error("Error logging system notification history:", error);
    }
}

/**
 * Automatically send a notification when an order's status changes
 */

const sendOrderStatusNotification = async (orderId, newStatus) => {
    try {
        // Fetch order and populate retailer details
        const order = await Order.findById(orderId).populate("retailerId");

        if (!order || !order.retailerId) {
            console.log(`[Notification Service] Order or Retailer not found for ID: ${orderId}`);
            return;
        }

        const retailer = order.retailerId;

        if (!retailer.fcmToken) {
            console.log(`[Notification Service] Retailer has no FCM token for Order: ${order.orderId}`);
            return;
        }

        // Generate status-specific copy

        let title = "";
        let body = "";

        switch (newStatus) {
            case "approved":
                title = "Order Approved! 🎉";
                body = `Good news! Your order ${order.orderId} has been approved by Balaji Namkeen.`;
                break;

            case "packed":
                title = "Order Packed! 📦";
                body = `Your order ${order.orderId} is packed and ready for dispatch.`;
                break;

            case "delivered":
                title = "Order Delivered! ✅";
                body = `Your order ${order.orderId} has been successfully delivered. Thank you for ordering!`;
                break;

            case "cancelled":
                title = "Order Cancelled ⚠️";
                body = `Your order ${order.orderId} has been cancelled. Please contact support.`;
                break;

            default:
                return;
        }


        // Include deep link to the Retailer app's Order details page

        const payload = {
            title,
            body,
            data: {
                link: "bnbretailer://orders", // matches React Native AppNavigator scheme
                orderId: order._id.toString()
            }
        }

        console.log(`[Notification Service] Dispatching Order Status Update to Retailer ${retailer._id} (${newStatus})`);

        const result = await notificationService.sendToSingleRetailer(retailer._id, payload);

        // Save notification history in DB
        await logSystemNotification(
            {
                title,
                body,
                targetType: "single",
                receiverCount: result.successCount,
                failedCount: result.failureCount,
                retailer: retailer._id,
                firebaseResponse: result.firebaseResponse
            }
        )

    }

    catch (error) {
        console.error("Error sending order status notification:", error);
    }
}

/**
 * Cron/Manual trigger to send re-engagement notifications to inactive retailers
 */

const sendInactiveRetailersNotification = async (days = 7) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        // Find recently active retailer IDs
        const activeIds = await Order.distinct("retailerId", {
            createdAt: { $gte: cutoffDate }
        })

        // Find inactive retailers with valid tokens
        const inactiveRetailers = await Retailer.find({
            _id: { $nin: activeIds },
            fcmToken: { $ne: null }
        });

        if (inactiveRetailers.length === 0) {
            console.log("[Notification Service] No inactive retailers found.");
            return;
        }

        const title = "We miss you! 🍯";
        const body = "It's been a while since your last order. Check out our products and place your order today!";

        // 
        const payload = {
            title,
            body,
            data: {
                link: "bnbretailer://home"
            }
        };

        const targetRetailerIds = inactiveRetailers.map(r => r._id);
        const result = await notificationService.sendToMultipleRetailers(targetRetailerIds, payload);

        // Save history in DB
        await logSystemNotification({
            title,
            body,
            targetType: "inactive",
            receiverCount: result.successCount,
            failedCount: result.failureCount,
            selectedRetailers: targetRetailerIds,
            inactiveDays: days,
            firebaseResponse: result.firebaseResponse
        });
    }
    catch (error) {
        console.error("Error sending inactive notifications:", error);
    }
}

module.exports = {
    sendOrderStatusNotification,
    sendInactiveRetailersNotification
};
