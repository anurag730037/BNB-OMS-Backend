const mongoose = require("mongoose")

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
        index: true,
    },

    subCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
        default: null
    },

    images: {
        type: [String],
        default: [],
    },
    description: {
        type: String,
        trim: true,
        default: ""
    },

    price: {
        type: Number,
        default: null
    },

    showPrice: {
        type: Boolean,
        default: false
    },

    availableSizes: {
        type: [String],
        default: ["500gm", '1kg']
    },

    isAvailable: {
        type: Boolean,
        default: true,
    }


}, {
    timestamps: true,
})

const Product = mongoose.model("Product", productSchema);

module.exports = Product;