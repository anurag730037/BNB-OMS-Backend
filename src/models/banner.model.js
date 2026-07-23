const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
    images: {
        type: [String],
        validate: {
            validator: function(v) {
                return v.length <= 5;
            },
            message: "You can upload a maximum of 5 banners."
        },
        default: []
    }
}, {
    timestamps: true
});

const Banner = mongoose.model("Banner", bannerSchema);
module.exports = Banner;
