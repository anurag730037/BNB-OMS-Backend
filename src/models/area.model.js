const mongoose = require("mongoose");

const areaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true // Prevents duplicate areas
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Area = mongoose.model("Area", areaSchema);
module.exports = Area;
