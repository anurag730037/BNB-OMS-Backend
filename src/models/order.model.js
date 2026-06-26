const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({

    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    packetSize: {
        type: String,
        required: true
    },

    quantityKg: {
        type: Number,
        required: true
    },

    notes:
    {
        type: String,
        default: ""
    }
}, {
    _id: false
}
);


const orderSchema = new mongoose.Schema({
    retailerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Retailer",
        required: true
    },

    items: {
        type: [orderItemSchema],
        required: true
    },

    status: {
        type: String,
        enum: ["pending", "approved", "packed", "delivered", "cancelled"],
        default: "pending"
    },

    adminNote: {
        type: String,
        default: ""
    },

    totalkg: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
})


const Order = mongoose.model("Order", orderSchema);

module.exports = Order;