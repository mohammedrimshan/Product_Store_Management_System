import Product from "../models/Product.js";
import { MESSAGES } from "../constants/messages.js";

const createProduct = async ({ name, sku }) => {
    const existing = await Product.findOne({ sku: sku.toUpperCase() });
    if (existing) {
        const err = new Error(MESSAGES.PRODUCT.SKU_EXISTS);
        err.status = 409;
        throw err;
    }

    const product = await Product.create({ name, sku });
    return product;
};

const getProducts = async () => {
    return Product.find().sort({ createdAt: -1 });
};

export { createProduct, getProducts };
