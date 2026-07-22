const admin = require("../config/firebase/firebase");

const sendNotification = async ({ token, title, body, data = {} }) => {

    try {
        const message = {
            token,
            notification: {
                title,
                body,
            },
            data,
        };

        const response = await admin.messaging().send(message);
        console.log("Notification Sent:", response);

        return response;
    }
    catch (error) {
        console.error("Notification Error:", error);
        throw error;
    }
}

const buildMessagePayload = ({ title, body, image, data, priority, sound }) => {
    const payload = {
        notification: {
            title,
            body,
        },
        data: data || {},
    };
    if (image) {
        payload.notification.imageUrl = image;
    }
    // Android configuration
    payload.android = {
        priority: priority || "high",
        notification: {
            sound: sound || "default",
        }
    };
    if (image) {
        payload.android.notification.imageUrl = image;
    }
    // APNs (iOS) configuration
    payload.apns = {
        payload: {
            aps: {
                sound: sound || "default",
            }
        }
    };
    if (image) {
        payload.apns.fcmOptions = {
            imageUrl: image
        };
    }
    return payload;
};

/**
 * Send notification to a single retailer by their ID
 */
const sendToSingleRetailer = async (retailerId, payload) => {
    try {
        const retailer = await Retailer.findById(retailerId);
        if (!retailer || !retailer.fcmToken) {
            console.log(`No active FCM token found for retailer: ${retailerId}`);
            return null;
        }
        const message = {
            token: retailer.fcmToken,
            ...buildMessagePayload(payload)
        };
        const response = await admin.messaging().send(message);

        // Update notification timestamp
        retailer.lastNotificationAt = new Date();
        await retailer.save();
        console.log(`Notification sent to retailer ${retailerId}:`, response);
        return response;
    } catch (error) {
        console.error(`Error sending notification to retailer ${retailerId}:`, error);
        throw error;
    }
};

/**
 * Send notification to multiple retailers by their IDs
 */
const sendToMultipleRetailers = async (retailerIds, payload) => {
    try {
        const retailers = await Retailer.find({
            _id: { $in: retailerIds },
            fcmToken: { $ne: null }
        });
        const tokens = retailers.map(r => r.fcmToken);
        if (tokens.length === 0) {
            console.log("No valid FCM tokens found for the provided retailers.");
            return null;
        }
        const message = {
            tokens,
            ...buildMessagePayload(payload)
        };
        const response = await admin.messaging().sendEachForMulticast(message);
        // Update timestamps for matching retailers
        await Retailer.updateMany(
            { _id: { $in: retailers.map(r => r._id) } },
            { $set: { lastNotificationAt: new Date() } }
        );
        console.log("Multicast notifications status:", response);
        return response;
    } catch (error) {
        console.error("Error sending multicast notifications:", error);
        throw error;
    }
};

/**
 * Send notification to all active retailers
 */
const sendToAllRetailers = async (payload) => {
    try {
        const retailers = await Retailer.find({ fcmToken: { $ne: null } });
        const tokens = retailers.map(r => r.fcmToken);
        if (tokens.length === 0) {
            console.log("No active FCM tokens found in the database.");
            return null;
        }
        const message = {
            tokens,
            ...buildMessagePayload(payload)
        };
        const response = await admin.messaging().sendEachForMulticast(message);
        // Update timestamps for all target retailers
        await Retailer.updateMany(
            { fcmToken: { $ne: null } },
            { $set: { lastNotificationAt: new Date() } }
        );
        console.log("Global notifications status:", response);
        return response;
    } catch (error) {
        console.error("Error sending global notifications:", error);
        throw error;
    }
};

module.exports = {
    sendNotification,
    sendToSingleRetailer,
    sendToMultipleRetailers,
    sendToAllRetailers
};

