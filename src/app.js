const express = require("express");
const cors = require("cors");

const adminRoutes = require("./routes/admin.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const retailerRoutes = require("./routes/retailer.routes");
const orderRoutes = require("./routes/order.routes");
const productRoutes = require("./routes/product.routes");
const categoryRoutes = require("./routes/category.routes");
const subcategoryRoutes = require("./routes/subcategory.routes");
const areaRoutes = require("./routes/area.routes");
const supportRoutes = require("./routes/support.routes");
const bannerRoutes = require("./routes/banner.routes");

const app = express()

app.use(cors({
    origin: true,
    credentials: true
})); //allows frontend to talk to backend with credentials
app.use(express.json()); //reads JSON request body

app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/retailer", retailerRoutes);
app.use("/api/order", orderRoutes)
app.use("/api/category", categoryRoutes);
app.use("/api/product", productRoutes);
app.use("/api/subcategory", subcategoryRoutes);
app.use("/api/area", areaRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/banners", bannerRoutes);

app.get("/", (req, res) => {
    res.send("API Working");
});
module.exports = app;