const jwt = require("jsonwebtoken")

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

        // this will decode the token and get userId



        const decoded = jwt.verify(token, process.env.JWT_SECRET);

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