const Order = require("../models/order.model");

const migrateOrders = async () => {
    try {
        const ordersWithoutId = await Order.find({
            $or: [
                { orderId: { $exists: false } },
                { orderId: null }
            ]
        });

        if (ordersWithoutId.length > 0) {
            console.log(`[Migration] Found ${ordersWithoutId.length} orders without an orderId. Migrating...`);
            let count = 0;

            for (const order of ordersWithoutId) {
                // Determine the date of the order (fallback to now if createdAt is not available)
                const date = order.createdAt ? new Date(order.createdAt) : new Date();
                const yy = String(date.getFullYear()).slice(-2);
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');

                // Keep generating random suffix until we get a unique orderId for this order
                let isUnique = false;
                let candidateId = "";
                let attempts = 0;
                const maxAttempts = 100;

                while (!isUnique && attempts < maxAttempts) {
                    attempts++;
                    const randomDigits = Math.floor(1000 + Math.random() * 9000);
                    candidateId = `BNB-${yy}${mm}${dd}${randomDigits}`;

                    const existing = await Order.findOne({ orderId: candidateId });
                    if (!existing) {
                        isUnique = true;
                    }
                }

                if (isUnique) {
                    order.orderId = candidateId;
                    await order.save();
                    count++;
                } else {
                    console.error(`[Migration] Failed to generate a unique orderId for order ${order._id}`);
                }
            }
            console.log(`[Migration] Successfully migrated ${count} of ${ordersWithoutId.length} orders.`);
        } else {
            console.log("[Migration] No orders missing orderId found.");
        }
    } catch (error) {
        console.error("[Migration] Error migrating orders:", error);
    }
};

module.exports = migrateOrders;
