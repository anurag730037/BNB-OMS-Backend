const mongoose = require("mongoose");

const retailerSchema = new mongoose.Schema({

    shopName: {
        type: String,
        required: true,
        trim: true
    },

    ownerName: {
        type: String,
        required: true,
        trim: true
    },

    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },

    address: {
        type: String,
        required: true,
        trim: true
    },
    area: {
        type: String,
        required: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
});

const Retailer = mongoose.model("Retailer", retailerSchema);

module.exports = Retailer;