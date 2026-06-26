const express = require("express");
const {
    createSubcategory,
    getAllSubcategories,
    updateSubcategory,
    toggleSubcategoryStatus
} = require("../controllers/subcategory.controller");

const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create", protect, authorizeRoles("admin"), createSubcategory);
router.get("/all", getAllSubcategories);
router.put("/update/:subcategoryId", protect, authorizeRoles("admin"), updateSubcategory);
router.patch("/toggle/:subcategoryId", protect, authorizeRoles("admin"), toggleSubcategoryStatus);

module.exports = router;