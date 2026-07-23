const Notification = require("../models/notification.model");
const Retailer = require("../models/retailer.model");
const Order = require("../models/order.model");
const notificationService = require("../services/notification.service");


const sendAdminNotification = async (req, res) => {
    try {
        const { title, body, image, targetType, retailerId, retailerIds, areaId, inactiveDays } = req.body;

        // 1. Request Validation
        if (!title || !body || !targetType) {
            return res.status(400).json({
                success: false,
                message: "title, body, and targetType are required fields."
            });
        }

        const validTargets = ["all", "single", "selected", "area", "inactive"];

        if (!validTargets.includes(targetType)) {
            return res.status(400).json({
                success: false,
                message: `Invalid targetType. Must be one of: ${validTargets.join(", ")}`
            });
        }

        let targetRetailerIds = [];

        const payload = { title, body, image };

        // 2. Fetch Matching Retailers depending on targetType
        if (targetType === "single") {
            if (!retailerId) {
                return res.status(400).json({ success: false, message: "retailerId is required for single target type" });
            }

            targetRetailerIds = [retailerId]
        }

        else if (targetType === "selected") {
            if (!retailerIds || !Array.isArray(retailerIds) || retailerIds.length === 0) {
                return res.status(400).json({ success: false, message: "retailerIds array is required for selected target type" });
            }

            targetRetailerIds = retailerIds
        }

        else if (targetType === "area") {
            if (!areaId) {
                return res.status(400).json({ success: false, message: "areaId is required for area target type" });
            }

            // Fetch all retailers in this area

            const retailers = await Retailer.find({ area: areaId }).select("_id");
            targetRetailerIds = retailers.map(r => r._id);
        }

        else if (targetType === "inactive") {
            const days = parseInt(inactiveDays);
            const cutOffDate = new Date();

            cutOffDate.setDate(cutOffDate.getDate() - days);

            // Step A: Find all retailers who have placed an order since cutoffDate
            const recentlyActiveRetailers = await Order.distinct("retailerId", {
                createdAt: { $gte: cutOffDate }
            })

            // Step B: Find retailers who are NOT in that list
            const inactiveRetailers = await Retailer.find({
                _id: { $nin: recentlyActiveRetailers }
            }).select("_id");

            targetRetailerIds = inactiveRetailers.map((r) => r._id)


        }

        // 3. Call Notification Service

        let serviceResult;

        if (targetType === "all") {
            serviceResult = await notificationService.sendToAllRetailers(payload)
        }
        else if (targetType === "single") {
            serviceResult = await notificationService.sendToSingleRetailer(retailerId, payload);
        }
        else {
            // "selected", "area", or "inactive" all resolve to an array of retailer IDs
            if (targetRetailerIds.length === 0) {
                return res.status(200).json({
                    success: true,
                    receiverCount: 0,
                    failedCount: 0,
                    message: "No target retailers found to send notifications."
                });
            }

            serviceResult = await notificationService.sendToMultipleRetailers(targetRetailerIds, payload);
        }

        // 4. Save Notification History

        const notificationHistory = await Notification.create({
            title,
            body,
            image: image || "",
            targetType,
            receiverCount: serviceResult.successCount, // Fixed key
            failedCount: serviceResult.failureCount,
            firebaseResponse: serviceResult.firebaseResponse,
            sentBy: req.user.userId, // Fixed schema key and user reference
            area: targetType === "area" ? areaId : null,
            retailer: targetType === "single" ? retailerId : null,
            selectedRetailers: targetType === "selected" ? retailerIds : [],
            inactiveDays: targetType === "inactive" ? inactiveDays : null,
            status: (serviceResult.successCount > 0) ? "sent" : "failed"
        });


        // 5. Detailed response
        return res.status(200).json({
            success: true,
            receiverCount: serviceResult.successCount,
            failedCount: serviceResult.failureCount,
            message: "Notification processed successfully."
        });

    }
    catch (error) {
        console.error("Error in sendAdminNotification controller:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to process and send notification."
        });
    }
}

const Admin = require("../models/admin.model");

const getNotificationHistory = async (req, res) => {
    try {
        const { search, targetType, startDate, endDate, sentBy, page = 1, limit = 10 } = req.query;

        let query = {};

        // 1. Search filter in Title and Body
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { body: { $regex: search, $options: "i" } }
            ];
        }

        // 2. Target Type filter
        if (targetType && targetType !== "") {
            query.targetType = targetType;
        }

        // 3. Date Range filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        // 4. Admin Sender filter
        if (sentBy && sentBy !== "") {
            if (sentBy === "system") {
                query.sentBy = null;
            } else {
                query.sentBy = sentBy;
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Fetch paginated notification history logs
        const totalCount = await Notification.countDocuments(query);
        const notifications = await Notification.find(query)
            .populate("sentBy", "name email")
            .populate("area", "name")
            .populate("retailer", "shopName ownerName phone")
            .populate("selectedRetailers", "shopName ownerName phone")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Fetch the unique list of admins who have ever sent notifications
        const sentByAdmins = await Notification.distinct("sentBy", { sentBy: { $ne: null } });
        const adminsList = await Admin.find({ _id: { $in: sentByAdmins } }).select("name email");

        return res.status(200).json({
            success: true,
            totalCount,
            totalPages: Math.ceil(totalCount / parseInt(limit)),
            currentPage: parseInt(page),
            adminsList,
            notifications
        });
    } catch (error) {
        console.error("Error in getNotificationHistory controller:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch notification history logs."
        });
    }
}

module.exports = {
    sendAdminNotification,
    getNotificationHistory
};