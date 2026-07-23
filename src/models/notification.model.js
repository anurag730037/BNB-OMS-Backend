const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    body: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        default: ""
    },
    targetType: {
        type: String,
        enum: ["all", "single", "selected", "area", "inactive"],
        required: true
    },
    receiverCount: {
        type: Number,
        default: 0
    },
    failedCount: {
        type: Number,
        default: 0
    },
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: false,
        default: null,
    },
    area: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Area",
        default: null
    },
    retailer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Retailer",
        default: null
    },
    selectedRetailers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Retailer"
    }],
    inactiveDays: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ["pending", "sent", "failed"],
        default: "pending"
    },
    firebaseResponse: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, {
    timestamps: true
});
const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;