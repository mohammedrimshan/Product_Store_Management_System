import mongoose from "mongoose";
import Stock from "../models/Stock.js";
import Product from "../models/Product.js";
import Store from "../models/Store.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";

const createStock = async (req, res) => {
    try {
        const { productId, storeId, quantity } = req.body;

        if (!productId || !storeId || quantity === undefined) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.STOCK.FIELDS_REQUIRED,
            });
        }

        if (!Number.isInteger(quantity) || quantity < 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.STOCK.QUANTITY_NON_NEGATIVE,
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: MESSAGES.PRODUCT.NOT_FOUND,
            });
        }

        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: MESSAGES.STORE.NOT_FOUND,
            });
        }

        const existing = await Stock.findOne({ product: productId, store: storeId });
        if (existing) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                success: false,
                message: MESSAGES.STOCK.ALREADY_EXISTS,
            });
        }

        const stock = await Stock.create({ product: productId, store: storeId, quantity });

        const populated = await stock.populate([
            { path: "product", select: "name sku" },
            { path: "store", select: "name location" },
        ]);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: MESSAGES.STOCK.CREATED,
            data: populated,
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
};

const getStock = async (req, res) => {
    try {
        const { threshold } = req.query;
        const filter = {};

        if (threshold !== undefined) {
            const parsed = Number(threshold);
            if (isNaN(parsed) || parsed < 0) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    message: MESSAGES.STOCK.INVALID_THRESHOLD,
                });
            }
            filter.quantity = { $lte: parsed };
        }

        const stocks = await Stock.find(filter)
            .populate("product", "name sku")
            .populate("store", "name location")
            .sort({ createdAt: -1 });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: MESSAGES.STOCK.FETCHED,
            data: stocks,
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
};

const adjustStock = async (req, res) => {
    try {
        const { productId, storeId, delta } = req.body;

        if (!productId || !storeId || delta === undefined) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.STOCK.FIELDS_REQUIRED,
            });
        }

        if (!Number.isInteger(delta) || delta === 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.STOCK.DELTA_NON_ZERO,
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: MESSAGES.PRODUCT.NOT_FOUND,
            });
        }

        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: MESSAGES.STORE.NOT_FOUND,
            });
        }

        let updated;

        if (delta > 0) {
            updated = await Stock.findOneAndUpdate(
                { product: productId, store: storeId },
                { $inc: { quantity: delta } },
                { new: true, upsert: true }
            ).populate([
                { path: "product", select: "name sku" },
                { path: "store", select: "name location" },
            ]);
        } else {
            updated = await Stock.findOneAndUpdate(
                { product: productId, store: storeId, quantity: { $gte: -delta } },
                { $inc: { quantity: delta } },
                { new: true }
            ).populate([
                { path: "product", select: "name sku" },
                { path: "store", select: "name location" },
            ]);

            if (!updated) {
                const exists = await Stock.findOne({ product: productId, store: storeId });

                if (!exists) {
                    return res.status(HTTP_STATUS.NOT_FOUND).json({
                        success: false,
                        message: MESSAGES.STOCK.NOT_FOUND,
                    });
                }

                return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
                    success: false,
                    message: MESSAGES.STOCK.WOULD_GO_NEGATIVE,
                });
            }
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: MESSAGES.STOCK.ADJUSTED,
            data: updated,
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
};

const transferStock = async (req, res) => {
    const { productId, fromStoreId, toStoreId, quantity } = req.body;

    if (!productId || !fromStoreId || !toStoreId || quantity === undefined) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.STOCK.TRANSFER_FIELDS_REQUIRED,
        });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.STOCK.QUANTITY_POSITIVE,
        });
    }

    if (fromStoreId === toStoreId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.STOCK.SAME_STORE,
        });
    }

    const [product, fromStore, toStore] = await Promise.all([
        Product.findById(productId),
        Store.findById(fromStoreId),
        Store.findById(toStoreId),
    ]);

    if (!product) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: MESSAGES.PRODUCT.NOT_FOUND,
        });
    }

    if (!fromStore) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: MESSAGES.STOCK.SOURCE_STORE_NOT_FOUND,
        });
    }

    if (!toStore) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
            success: false,
            message: MESSAGES.STOCK.DEST_STORE_NOT_FOUND,
        });
    }

    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            const sourceStock = await Stock.findOneAndUpdate(
                { product: productId, store: fromStoreId, quantity: { $gte: quantity } },
                { $inc: { quantity: -quantity } },
                { new: true, session }
            );

            if (!sourceStock) {
                throw new Error(MESSAGES.STOCK.INSUFFICIENT_STOCK);
            }

            const destStock = await Stock.findOneAndUpdate(
                { product: productId, store: toStoreId },
                { $inc: { quantity: quantity } },
                { new: true, session, upsert: true }
            );

            result = { sourceStock, destStock };
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: MESSAGES.STOCK.TRANSFERRED,
            data: result,
        });
    } catch (error) {
        if (error.message === MESSAGES.STOCK.INSUFFICIENT_STOCK) {
            return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
                success: false,
                message: error.message,
            });
        }

        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    } finally {
        await session.endSession();
    }
};

export { createStock, getStock, adjustStock, transferStock };
