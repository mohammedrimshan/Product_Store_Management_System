import Product from "../models/Product.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";

const createProduct = async (req, res) => {
    try {
        const { name, sku } = req.body;

        if (!name || !sku) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.PRODUCT.FIELDS_REQUIRED,
            });
        }

        const existing = await Product.findOne({ sku: sku.toUpperCase() });

        if (existing) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                message: MESSAGES.PRODUCT.SKU_EXISTS,
            });
        }

        const product = await Product.create({ name, sku });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: MESSAGES.PRODUCT.CREATED,
            data: product,
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
};

const getProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: MESSAGES.PRODUCT.FETCHED,
            data: products,
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
};

export { createProduct, getProducts };
