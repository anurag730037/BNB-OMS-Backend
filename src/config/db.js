const mongoose = require("mongoose");
const migrateOrders = require("../utils/migrateOrders");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");
        await migrateOrders();
    } catch (error) {
        console.log("Database connection failed:", error.message);
        process.exit(1);

    }
}

module.exports = connectDB;