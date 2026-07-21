const Support = require("../models/support.model");

// Get Support Info
const getSupportInfo = async (req, res) => {
    try {
        let support = await Support.findOne();

        // If no support document exists yet, return default empty structure
        if (!support) {
            support = await Support.create({});
        }

        return res.status(200).json({
            success: true,
            support
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Support Info (Admin only)
const updateSupportInfo = async (req, res) => {
    try {
        const { phone, whatsapp, email, timing, address, message } = req.body;

        let support = await Support.findOne();

        if (!support) {
            support = new Support({ phone, whatsapp, email, timing, address, message });
        } else {
            if (phone !== undefined) support.phone = phone;
            if (whatsapp !== undefined) support.whatsapp = whatsapp;
            if (email !== undefined) support.email = email;
            if (timing !== undefined) support.timing = timing;
            if (address !== undefined) support.address = address;
            if (message !== undefined) support.message = message;
        }

        await support.save();

        return res.status(200).json({
            success: true,
            message: "Support information updated successfully",
            support
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getSupportInfo,
    updateSupportInfo
};
