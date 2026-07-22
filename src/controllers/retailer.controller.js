const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const Retailer = require('../models/retailer.model')


const registerRetailer = async (req, res) => {
    try {
        const { shopName, ownerName, phone, password, area, address } = req.body;

        if (!shopName || !ownerName || !phone || !password || !area || !address) {
            return res.status(400).json({ message: "All Fields Are Required" })
        }

        // Check if retailer exists
        const exist = await Retailer.findOne({ phone })
        if (exist) {
            return res.status(400).json({ message: "Retailer Already Exists" })
        }

        // Hash password

        const hashedPassword = await bcrypt.hash(password, 10);

        //Create Retailer
        const retailer = await Retailer.create({
            shopName,
            ownerName,
            phone,
            password: hashedPassword,
            area,
            address
        })

        const retailerResponse = retailer.toObject();
        delete retailerResponse.password;
        delete retailerResponse.__v;

        return res.status(201).json({
            success: true,
            message: "Retailer created successfully",
            retailer: retailerResponse
        });

    }
    catch (error) {
        console.log("Error in retailer registration:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
const loginRetailer = async (req, res) => {

    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({
                message: "All Fields Are Required"
            })
        }

        // Find retailer

        const retailer = await Retailer.findOne({ phone });

        if (!retailer) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            })
        }

        // check active 

        if (!retailer.isActive) {
            return res.status(400).json({
                success: false,
                message: "This Account is disabled",
            })
        }

        //Compare password

        const isMatch = await bcrypt.compare(password, retailer.password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            })
        }

        //Generating Token

        const token = await jwt.sign({
            userId: retailer._id,
            role: "retailer",
            phone: retailer.phone
        }, process.env.JWT_SECRET);

        // Remove password
        const retailerResponse = retailer.toObject();
        delete retailerResponse.password;
        delete retailerResponse.__v;

        return res.status(200).json({
            success: true,
            message: "Retailer login successful",
            retailer: retailerResponse,
            token,
        });

    }
    catch (error) {
        console.log("Error in retailer login:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }

}

const getAllRetailers = async (req, res) => {
    try {
        const { search, area, isActive } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { shopName: { $regex: search, $options: "i" } },
                { ownerName: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } }
            ];
        }
        if (area) {
            query.area = area;
        }
        if (isActive !== undefined && isActive !== "") {
            query.isActive = isActive === "true";
        }

        const retailers = await Retailer.find(query).select("-password -__v").populate("area").sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: retailers.length,
            retailers
        });

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });

    }
}

const getSingleRetailer = async (req, res) => {
    try {
        const { retailerId } = req.params;

        const { userId, role } = req.user;

        const retailer = await Retailer.findById(retailerId).populate("area", "name");

        if (!retailer) {
            return res.status(404).json({
                success: false,
                message: "Retailer not found"
            });
        }

        const retailerResponse = retailer.toObject();
        delete retailerResponse.password;
        delete retailerResponse.__v;

        if (role === "retailer") {
            if (retailerResponse._id.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized access"
                })
            }
            return res.status(200).json({
                success: true,
                message: "Retailer Profile",
                retailer: retailerResponse
            });
        }

        if (role === "admin") {
            return res.status(200).json({
                success: true,
                retailer: retailerResponse
            });
        }

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }

}

const updateRetailer = async (req, res) => {
    try {

        const { retailerId } = req.params;
        const { shopName, ownerName, phone, area, address } = req.body;

        const retailer = await Retailer.findById(retailerId);

        if (!retailer) {
            return res.status(404).json({
                success: false,
                message: "Retailer not found"
            });
        }

        retailer.shopName = shopName ?? retailer.shopName;
        retailer.ownerName = ownerName ?? retailer.ownerName;
        retailer.phone = phone ?? retailer.phone;
        retailer.area = area ?? retailer.area;
        retailer.address = address ?? retailer.address;

        await retailer.save();

        const retailerResponse = retailer.toObject();
        delete retailerResponse.password;
        delete retailerResponse.__v;

        return res.status(200).json({
            success: true,
            message: "Retailer updated successfully",
            retailer: retailerResponse
        });

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


const toggleRetailerStatus = async (req, res) => {
    try {
        const { retailerId } = req.params;

        const retailer = await Retailer.findById(retailerId);
        if (!retailer) {
            return res.status(404).json({
                success: false,
                message: "Retailer not found"
            });
        }

        retailer.isActive = !retailer.isActive;

        await retailer.save();

        const retailerResponse = retailer.toObject();
        delete retailerResponse.password;
        delete retailerResponse.__v;

        return res.status(200).json({
            success: true,
            message: `Retailer ${retailer.isActive ? "activated" : "deactivated"} successfully`,
            retailer: retailerResponse
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Change Password for Logged-In Retailer
const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const retailerId = req.user.userId;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Both old and new passwords are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long"
            });
        }

        const retailer = await Retailer.findById(retailerId);
        if (!retailer) {
            return res.status(404).json({
                success: false,
                message: "Retailer not found"
            });
        }

        // Compare current password
        const isMatch = await bcrypt.compare(oldPassword, retailer.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect current password"
            });
        }

        // Hash new password and save
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        retailer.password = hashedPassword;
        retailer.passwordChangedAt = new Date();
        await retailer.save();

        // Issue a fresh token for current device (issued after passwordChangedAt)
        const token = jwt.sign({
            userId: retailer._id,
            role: "retailer",
            phone: retailer.phone
        }, process.env.JWT_SECRET);

        return res.status(200).json({
            success: true,
            message: "Password changed successfully",
            token
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Admin Reset Retailer Password (No old password required)
const adminResetRetailerPassword = async (req, res) => {
    try {
        const { retailerId } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password is required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters long"
            });
        }

        const retailer = await Retailer.findById(retailerId);
        if (!retailer) {
            return res.status(404).json({
                success: false,
                message: "Retailer not found"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        retailer.password = hashedPassword;
        retailer.passwordChangedAt = new Date();
        await retailer.save();

        return res.status(200).json({
            success: true,
            message: "Retailer password reset successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const updateDeviceToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;

        if (!fcmToken) {
            return res.status(400).json({
                success: false,
                message: "FCM token is required"
            })
        }

        // Update current logged-in retailer's token using ID from auth middleware

        const retailer = await Retailer.findByIdAndUpdate(
            req.user.userId, { fcmToken }, { new: true }
        )

        if (!retailer) {
            return res.status(404).json({
                success: false,
                message: "Retailer not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "FCM Token Updated"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    registerRetailer,
    loginRetailer,
    getAllRetailers,
    getSingleRetailer,
    updateRetailer,
    toggleRetailerStatus,
    changePassword,
    adminResetRetailerPassword,
    updateDeviceToken
}