const { getMessaging } = require("firebase-admin/messaging");
const firebaseApp = require("../config/firebase/firebase");
const Retailer = require("../models/retailer.model");

const messaging = getMessaging(firebaseApp);

const buildMessagePayload = ({ title, body, image, data, priority, sound }) => {
    const payload = {
        notification: {
            title,
            body,
        },
        data: data || {},
    };
    if (image) {
        payload.notification.image = image;
    }
    // Android configuration
    payload.android = {
        priority: priority || "high",
        notification: {
            sound: sound || "default",
            channelId: "default",
            notificationPriority: "PRIORITY_HIGH",
        }
    };
    if (image) {
        payload.android.notification.image = image;
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
            image: image
        };
    }
    return payload;
};

/**
 * Handle invalid/expired tokens from Multicast Batch Responses
 */
const cleanupExpiredTokens = async (tokens, responses) => {
    const tokensToRemove = [];
    responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
            const code = resp.error.code;
            if (
                code === "messaging/registration-token-not-registered" ||
                code === "messaging/invalid-registration-token"
            ) {
                tokensToRemove.push(tokens[idx]);
            }
        }
    });

    if (tokensToRemove.length > 0) {
        await Retailer.updateMany(
            { fcmToken: { $in: tokensToRemove } },
            { $set: { fcmToken: null } }
        );
        console.log(`[FCM Cleanup] Cleared ${tokensToRemove.length} expired FCM tokens.`);
    }
};

/**
 * Send notification to a single retailer
 */
const sendToSingleRetailer = async (retailerId, payload) => {
    try {
        const retailer = await Retailer.findById(retailerId);
        if (!retailer || !retailer.fcmToken) {
            return { successCount: 0, failureCount: 1, responses: [{ success: false, error: { message: "No FCM Token found" } }] };
        }

        const message = {
            token: retailer.fcmToken,
            ...buildMessagePayload(payload)
        };

        const response = await messaging.send(message);

        // Update last notification timestamp
        retailer.lastNotificationAt = new Date();
        await retailer.save();

        return {
            successCount: 1,
            failureCount: 0,
            firebaseResponse: response
        };
    } catch (error) {
        console.error(`Error sending notification to retailer ${retailerId}:`, error);

        // Remove token if expired
        if (
            error.code === "messaging/registration-token-not-registered" ||
            error.code === "messaging/invalid-registration-token"
        ) {
            await Retailer.findByIdAndUpdate(retailerId, { fcmToken: null });
        }

        return {
            successCount: 0,
            failureCount: 1,
            firebaseResponse: error
        };
    }
};

/**
 * Send notification to multiple retailers (deduplicates tokens)
 */
const sendToMultipleRetailers = async (retailerIds, payload) => {
    try {
        const retailers = await Retailer.find({
            _id: { $in: retailerIds },
            fcmToken: { $ne: null }
        });

        // 1. Remove duplicate tokens
        const tokens = Array.from(new Set(retailers.map(r => r.fcmToken)));

        if (tokens.length === 0) {
            return {
                successCount: 0,
                failureCount: retailerIds.length,
                firebaseResponse: { message: "No valid FCM tokens found for target users" }
            };
        }

        const message = {
            tokens,
            ...buildMessagePayload(payload)
        };

        // 2. Call Notification Service
        const response = await messaging.sendEachForMulticast(message);

        // 3. Update timestamps
        await Retailer.updateMany(
            { _id: { $in: retailers.map(r => r._id) } },
            { $set: { lastNotificationAt: new Date() } }
        );

        // 4. Handle invalid/expired tokens asynchronously
        await cleanupExpiredTokens(tokens, response.responses);

        return {
            successCount: response.successCount,
            failureCount: response.failureCount,
            firebaseResponse: response
        };
    } catch (error) {
        console.error("Error sending multicast notifications:", error);
        throw error;
    }
};

/**
 * Send notification to every active retailer
 */
const sendToAllRetailers = async (payload) => {
    try {
        const retailers = await Retailer.find({ fcmToken: { $ne: null } });
        const tokens = Array.from(new Set(retailers.map(r => r.fcmToken)));

        if (tokens.length === 0) {
            return {
                successCount: 0,
                failureCount: 0,
                firebaseResponse: { message: "No FCM tokens found in DB" }
            };
        }

        const message = {
            tokens,
            ...buildMessagePayload(payload)
        };

        const response = await messaging.sendEachForMulticast(message);

        await Retailer.updateMany(
            { fcmToken: { $ne: null } },
            { $set: { lastNotificationAt: new Date() } }
        );

        await cleanupExpiredTokens(tokens, response.responses);

        return {
            successCount: response.successCount,
            failureCount: response.failureCount,
            firebaseResponse: response
        };
    } catch (error) {
        console.error("Error sending global notifications:", error);
        throw error;
    }
};

module.exports = {
    sendToSingleRetailer,
    sendToMultipleRetailers,
    sendToAllRetailers
};
