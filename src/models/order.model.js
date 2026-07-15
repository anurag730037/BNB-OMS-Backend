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
    orderId: {
        type: String,
        unique: true,
        sparse: true
    },

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

// Helper to generate a date-based obfuscated random ID
const generateOrderId = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    return `BNB-${yy}${mm}${dd}${randomDigits}`;
};

// Pre-save hook to assign unique orderId
orderSchema.pre("save", async function () {
    if (this.isNew && !this.orderId) {
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
            attempts++;
            const candidateId = generateOrderId();
            const existing = await this.constructor.findOne({ orderId: candidateId });
            if (!existing) {
                this.orderId = candidateId;
                isUnique = true;
            }
        }

        if (!isUnique) {
            throw new Error("Failed to generate a unique Order ID after multiple attempts.");
        }
    }
});


const Order = mongoose.model("Order", orderSchema);

module.exports = Order;