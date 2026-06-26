const express = require("express");
const {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
} = require("../controllers/category.controller");

const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create", protect, authorizeRoles("admin"), createCategory);
router.get("/all", getAllCategories);
router.put("/update/:categoryId", protect, authorizeRoles("admin"), updateCategory);
router.delete("/delete/:categoryId", protect, authorizeRoles("admin"), deleteCategory);
router.patch("/toggle/:categoryId", protect, authorizeRoles("admin"), toggleCategoryStatus);

module.exports = router;