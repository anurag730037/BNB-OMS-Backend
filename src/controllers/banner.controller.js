const Banner = require("../models/banner.model");

// GET /api/banners (Public)
const getBanners = async (req, res) => {
    try {
        let bannerDoc = await Banner.findOne();
        if (!bannerDoc) {
            return res.status(200).json({
                success: true,
                images: []
            });
        }

        return res.status(200).json({
            success: true,
            images: bannerDoc.images
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// PUT /api/admin/banners (Admin Only)
const updateBanners = async (req, res) => {
    try {
        const { images } = req.body;

        if (!images || !Array.isArray(images)) {
            return res.status(400).json({
                success: false,
                message: "images must be an array of image URLs."
            });
        }

        if (images.length > 5) {
            return res.status(400).json({
                success: false,
                message: "Maximum of 5 banners allowed."
            });
        }

        let bannerDoc = await Banner.findOne();
        if (!bannerDoc) {
            bannerDoc = await Banner.create({ images });
        } else {
            bannerDoc.images = images;
            await bannerDoc.save();
        }

        return res.status(200).json({
            success: true,
            message: "Banners updated successfully.",
            images: bannerDoc.images
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getBanners,
    updateBanners
};
