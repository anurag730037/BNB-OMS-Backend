
const Product = require("../models/product.model");

const createProduct = async (req, res) => {

    try {

        const {
            name,
            categoryId,
            subCategoryId,
            images,
            description,
            price,
            showPrice,
            availableSizes
        } = req.body;

        if (!name || !categoryId) {
            return res.status(400).json({
                success: false,
                message: "Name and Category are required"
            });
        }

        const product = await Product.create({
            name,
            categoryId,
            subCategoryId: subCategoryId || null,
            images: images || [],
            description: description || "",
            price: price || null,
            showPrice: showPrice || false,
            availableSizes: availableSizes || ["500gm", "1kg"]
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product
        });

    }
    catch (error) {

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });

    }

}

const getAllProducts = async (req, res) => {

    try {

        const products = await Product.find().populate("categoryId").populate("subCategoryId")


        return res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            products
        })

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }

}

const updateProduct = async (req, res) => {

    try {

        const { productId } = req.params;

        const updateProduct = await Product.findByIdAndUpdate(productId, req.body, { new: true })


        if (!updateProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            updateProduct
        });

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }

}

const toggleProductAvailability = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId)

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        product.isAvailable = !product.isAvailable;
        await product.save();

        return res.status(200).json({
            success: true,
            message: "Product availability changed successfully",
            product
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    createProduct,
    getAllProducts,
    updateProduct,
    toggleProductAvailability
};