const express = require("express");
const { createProduct, getAllProducts, updateProduct, toggleProductAvailability } = require("../controllers/product.controller");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");
const router = express.Router();


router.post("/create", protect, authorizeRoles("admin"), createProduct);
router.get("/all", getAllProducts);
router.put("/update/:productId", protect, authorizeRoles("admin"), updateProduct);
router.patch("/toggle/:productId", protect, authorizeRoles("admin"), toggleProductAvailability);

module.exports = router;