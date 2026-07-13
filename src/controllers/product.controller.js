
const Product = require("../models/product.model");
const Order = require("../models/order.model");

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
        console.error("Error in createProduct:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }

}

const getAllProducts = async (req, res) => {

    try {
        const { search, categoryId, subCategoryId, isAvailable } = req.query;
        let query = {};

        if (search) {
            query.name = { $regex: search, $options: "i" };
        }
        if (categoryId) {
            query.categoryId = categoryId;
        }
        if (subCategoryId) {
            query.subCategoryId = subCategoryId;
        }
        if (isAvailable !== undefined && isAvailable !== "") {
            query.isAvailable = isAvailable === "true";
        }

        const products = await Product.find(query).populate("categoryId", "name").populate("subCategoryId", "name")


        return res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            products
        })

    }
    catch (error) {
        console.error("Error in getAllProducts:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }

}

const getProductDetails = async (req, res) => {

    try {
        const { productId } = req.params;

        const product = await Product.findById(productId).populate("categoryId", "name").populate("subCategoryId", "name")

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            })
        }

        return res.status(200).json({
            success: true,
            message: "Product fetched successfully",
            product
        })

    }
    catch (error) {
        console.error("Error in getProductDetails:", error);
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
        console.error("Error in updateProduct:", error);
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
        console.error("Error in toggleProductAvailability:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


const getPopularProduct = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Orders Collection

        const populateAggregation = await Order.aggregate([
            {
                //$match (Only delivered orders in last 30 days)

                $match: {
                    status: "delivered",
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },

            //$unwind (One document per item)
            { $unwind: "$items" },

            //  $group (Group by productId and sum quantityKg)
            {
                $group: {
                    _id: "items.productId",
                    totalQuantity: { $sum: "$items.quantityKg" }
                }
            },

            // $sort (Most sold product first)
            {
                $sort: { totalQuantity: -1 }
            },

            //$limit (Keep only Limited products)
            {
                $limit: limit
            },

            //$lookup (Fetch full product details)
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails",
                }
            },

            //$unwind (Convert productDetails array to object)
            {
                $unwind: "$productDetails"
            },

            //$match (Remove unavailable products)
            {
                $match: {
                    "productDetails.isAvailable": true
                }
            },

            //$project (Return only the required fields)
            {
                $project: {
                    _id: 0,
                    productId: "$_id",
                    totalQuantity: 1,
                    product: "$productDetails"
                }
            }

        ]);

        let productList = [];

        if (populateAggregation.length > 0) {
            productList = populateAggregation.map(item => ({
                ...item.product,
                popularityVolume: item.totalQuantity
            }))
        }
        else {
            //  Fallback: If no order data, fetch the newest active products

            productList = await Product.find({ isAvailable: true })
                .populate("categoryId", "name").limit(limit);
        }

        return res.status(200).json({
            success: true,
            message: "Popular products fetched successfully",
            products: productList
        })

    } catch (error) {
        console.error("Error in getPopularProduct:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const getProductsByCategory = async (req, res) => {
    try {

        const { categoryId } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        if (!categoryId) {
            return res.status(400)
                .json({
                    success: false,
                    message: "categoryId query parameter is required"
                })
        }

        const query = {
            categoryId,
            isAvailable: true
        };

        // Run count and query in parallel for speed optimization

        const [totalProducts, products] = await Promise.all([
            Product.countDocuments(query),
            Product.find(query)
                .populate("categoryId", "name")
                .populate("subCategoryId", "name")
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
        ])

        const totalPages = Math.ceil(totalProducts / limit);

        return res.status(200).json({
            success: true,
            message: "Products fetched Successfully",
            pagination: {
                totalProducts,
                totalPages,
                currentPage: page,
                limit
            },
            products
        })

    }
    catch (error) {
        console.error("Error in getProductsByCategory:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

module.exports = {
    createProduct,
    getAllProducts, getProductDetails,
    updateProduct,
    toggleProductAvailability,
    getPopularProduct,
    getProductsByCategory,
};