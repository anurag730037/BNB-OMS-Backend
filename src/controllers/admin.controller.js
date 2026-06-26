const Admin = require("../models/admin.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")

const registerAdmin = async (req, res) => {

    try {
        const { name, email, password, phone, shopName, address } = req.body;

        //Validate Fields

        if (!name || !email || !password || !phone || !shopName || !address) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne();

        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: "Admin already exists"
            })
        }

        // Hash Password

        const hashedPassword = await bcrypt.hash(password, 10);

        //Create Admin

        const admin = await Admin.create({
            name,
            email,
            password: hashedPassword,
            phone,
            shopName,
            address
        })

        // Remove password from response

        const adminResponse = admin.toObject();
        delete adminResponse.password

        return res.status(201).json({
            success: true,
            message: "Admin created successfully",
            data: adminResponse
        })

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }

}

const loginAdmin = async (req, res) => {

    try {
        const { email, password } = req.body;

        //Validate Fields

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        //Find admin

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            })
        }

        // Check password

        const isPassValid = await bcrypt.compare(password, admin.password);
        if (!isPassValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials",
            })
        }

        //Generate JWT Token

        const token = jwt.sign({
            userId: admin._id,
            role: "admin"
        }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        })

        //Remove password
        const adminResponse = admin.toObject();
        delete adminResponse.password;

        return res.status(200).json({
            success: true,
            message: "Login successful",
            admin: adminResponse,
            token,
        });

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }

}



module.exports = {
    registerAdmin,
    loginAdmin
}