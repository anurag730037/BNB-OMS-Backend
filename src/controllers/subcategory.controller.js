const SubCategory = require("../models/subcategory.model");
const Category = require("../models/category.model");

const createSubcategory = async (req, res) => {

    try {

        const { name, categoryId } = req.body;
        if (!name || !categoryId) {
            return res.status(400).json({
                success: false,
                message: "Name and Category are required"
            });
        }

        // Check category exists
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Check duplicate inside same category
        const existingSubcategory = await SubCategory.findOne({
            name,
            categoryId
        });

        if (existingSubcategory) {
            return res.status(400).json({
                success: false,
                message: "Subcategory already exists in this category"
            });
        }


        const subcategory = await SubCategory.create({
            name,
            categoryId
        });

        return res.status(201).json({
            success: true,
            message: "Subcategory created successfully",
            subcategory
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }

}

// Get All Subcategories
const getAllSubcategories = async (req, res) => {
    try {
        const subcategories = await SubCategory.find()
            .populate("categoryId");

        return res.status(200).json({
            success: true,
            subcategories
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Subcategory
const updateSubcategory = async (req, res) => {
    try {
        const { subcategoryId } = req.params;

        const updatedSubcategory = await SubCategory.findByIdAndUpdate(
            subcategoryId,
            req.body,
            { new: true }
        );

        if (!updatedSubcategory) {
            return res.status(404).json({
                success: false,
                message: "Subcategory not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Subcategory updated successfully",
            subcategory: updatedSubcategory
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// toggle subcategory status
const toggleSubcategoryStatus = async (req, res) => {
    try {
        const { subcategoryId } = req.params;

        const subcategory = await SubCategory.findById(subcategoryId);

        if (!subcategory) {
            return res.status(404).json({
                success: false,
                message: "Subcategory not found"
            });
        }

        subcategory.isActive = !subcategory.isActive;
        await subcategory.save();

        return res.status(200).json({
            success: true,
            message: "Subcategory status updated successfully",
            subcategory
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createSubcategory,
    getAllSubcategories,
    updateSubcategory,
    toggleSubcategoryStatus
};