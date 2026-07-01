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
                message: "This Retailer Account is disabled",
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

        const retailers = await Retailer.find(query).populate("area").sort({ createdAt: -1 });

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

        const retailer = await Retailer.findById(retailerId);

        if (!retailer) {
            return res.status(404).json({
                success: false,
                message: "Retailer not found"
            });
        }

        const retailerResponse = retailer.toObject();
        delete retailerResponse.password;

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
                retailer
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

        return res.status(200).json({
            success: true,
            message: "Retailer updated successfully",
            retailer
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

        return res.status(200).json({
            success: true,
            message: `Retailer ${retailer.isActive ? "activated" : "deactivated"} successfully`,
            retailer
        });
    }
    catch (error) {
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
    toggleRetailerStatus
}