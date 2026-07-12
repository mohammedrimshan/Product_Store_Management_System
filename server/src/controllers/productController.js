import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";
import * as productService from "../services/productService.js";

const createProduct = async (req, res) => {
    try {
        const { name, sku } = req.body;

        if (!name || !sku) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.PRODUCT.FIELDS_REQUIRED,
            });
        }

        const product = await productService.createProduct({ name, sku });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: MESSAGES.PRODUCT.CREATED,
            data: product,
        });
    } catch (error) {
        const status = error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
        res.status(status).json({ success: false, message: error.message });
    }
};

const getProducts = async (req, res) => {
    try {
        const products = await productService.getProducts();
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
