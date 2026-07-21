const mongoose = require("mongoose");

const supportSchema = new mongoose.Schema({
    phone: {
        type: String,
        default: ""
    },
    whatsapp: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        default: ""
    },
    timing: {
        type: String,
        default: "Mon - Sat: 9:00 AM - 7:00 PM"
    },
    address: {
        type: String,
        default: ""
    },
    message: {
        type: String,
        default: "For any queries or assistance with your orders, please contact our support team."
    }
}, {
    timestamps: true
});

const Support = mongoose.model("Support", supportSchema);

module.exports = Support;
