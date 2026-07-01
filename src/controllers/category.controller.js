
const Category = require("../models/category.model");

const createCategory = async (req, res) => {

    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }
        // Check existing
        const existingCategory = await Category.findOne({ name });


        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Category already exists"
            });
        }

        const category = await Category.create({ name });

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            category
        });

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const getAllCategories = async (req, res) => {

    try {
        const { search, isActive } = req.query;
        let query = {};
        
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }
        if (isActive !== undefined && isActive !== "") {
            query.isActive = isActive === "true";
        }

        const categories = await Category.find(query);

        return res.status(200).json({
            success: true,
            categories
        });

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }

}

const updateCategory = async (req, res) => {

    try {
        const { categoryId } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Category name is required"
            });
        }

        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        category.name = name;
        await category.save();

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category
        });

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }

}

const deleteCategory = async (req, res) => {

    try {
        const { categoryId } = req.params;

        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        await category.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }

}

// Toggle Category Availability
const toggleCategoryStatus = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        category.isActive = !category.isActive;

        await category.save();

        return res.status(200).json({
            success: true,
            message: "Category status updated",
            category
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
};
