const mongoose = require("mongoose");

const subCategirySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const SubCategory = mongoose.model("SubCategory", subCategirySchema);
module.exports = SubCategory;