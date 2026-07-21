const jwt = require("jsonwebtoken")
const Retailer = require("../models/retailer.model");

const protect = async (req, res, next) => {
    try {
        let token;

        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }

        // no token
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Not authorized, token missing",
            });
        }

        // Decode token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // If user is a retailer, check DB to ensure account is active and token is not invalidated by password change
        if (decoded.role === "retailer") {
            const retailer = await Retailer.findById(decoded.userId).select("isActive passwordChangedAt");

            if (!retailer) {
                return res.status(401).json({
                    success: false,
                    message: "Account no longer exists",
                });
            }

            if (!retailer.isActive) {
                return res.status(401).json({
                    success: false,
                    message: "Account is disabled. Please contact support.",
                });
            }

            if (retailer.passwordChangedAt) {
                const passwordChangedTimestamp = parseInt(retailer.passwordChangedAt.getTime() / 1000, 10);
                if (decoded.iat < passwordChangedTimestamp) {
                    return res.status(401).json({
                        success: false,
                        message: "Password was changed recently. Please log in again.",
                    });
                }
            }
        }

        req.user = decoded;

        next();


    }
    catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }

}

const authorizeRoles = (...roles) => {

    return (req, res, next) => {
        //check roles

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to access this route",
            });
        }

        next();
    }
}

module.exports = {
    protect,
    authorizeRoles
}