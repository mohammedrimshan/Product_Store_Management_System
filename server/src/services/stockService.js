import mongoose from "mongoose";
import Stock from "../models/Stock.js";
import Product from "../models/Product.js";
import Store from "../models/Store.js";
import { MESSAGES } from "../constants/messages.js";

const assertProductAndStore = async (productId, storeId) => {
    const [product, store] = await Promise.all([
        Product.findById(productId),
        Store.findById(storeId),
    ]);

    if (!product) {
        const err = new Error(MESSAGES.PRODUCT.NOT_FOUND);
        err.status = 404;
        throw err;
    }

    if (!store) {
        const err = new Error(MESSAGES.STORE.NOT_FOUND);
        err.status = 404;
        throw err;
    }

    return { product, store };
};

const createStock = async ({ productId, storeId, quantity }) => {
    await assertProductAndStore(productId, storeId);

    const existing = await Stock.findOne({ product: productId, store: storeId });
    if (existing) {
        const err = new Error(MESSAGES.STOCK.ALREADY_EXISTS);
        err.status = 409;
        throw err;
    }

    const stock = await Stock.create({ product: productId, store: storeId, quantity });
    return stock.populate([
        { path: "product", select: "name sku" },
        { path: "store", select: "name location" },
    ]);
};

const getStock = async ({ threshold } = {}) => {
    const filter = {};

    if (threshold !== undefined) {
        const parsed = Number(threshold);
        if (isNaN(parsed) || parsed < 0) {
            const err = new Error(MESSAGES.STOCK.INVALID_THRESHOLD);
            err.status = 400;
            throw err;
        }
        filter.quantity = { $lte: parsed };
    }

    return Stock.find(filter)
        .populate("product", "name sku")
        .populate("store", "name location")
        .sort({ createdAt: -1 });
};

const adjustStock = async ({ productId, storeId, delta }) => {
    await assertProductAndStore(productId, storeId);

    let updated;

    if (delta > 0) {
        updated = await Stock.findOneAndUpdate(
            { product: productId, store: storeId },
            { $inc: { quantity: delta } },
            { returnDocument: "after", upsert: true }
        ).populate([
            { path: "product", select: "name sku" },
            { path: "store", select: "name location" },
        ]);
    } else {
        updated = await Stock.findOneAndUpdate(
            { product: productId, store: storeId, quantity: { $gte: -delta } },
            { $inc: { quantity: delta } },
            { returnDocument: "after" }
        ).populate([
            { path: "product", select: "name sku" },
            { path: "store", select: "name location" },
        ]);

        if (!updated) {
            const exists = await Stock.findOne({ product: productId, store: storeId });
            if (!exists) {
                const err = new Error(MESSAGES.STOCK.NOT_FOUND);
                err.status = 404;
                throw err;
            }
            const err = new Error(MESSAGES.STOCK.WOULD_GO_NEGATIVE);
            err.status = 422;
            throw err;
        }
    }

    return updated;
};

const transferStock = async ({ productId, fromStoreId, toStoreId, quantity }) => {
    const [product, fromStore, toStore] = await Promise.all([
        Product.findById(productId),
        Store.findById(fromStoreId),
        Store.findById(toStoreId),
    ]);

    if (!product) {
        const err = new Error(MESSAGES.PRODUCT.NOT_FOUND);
        err.status = 404;
        throw err;
    }
    if (!fromStore) {
        const err = new Error(MESSAGES.STOCK.SOURCE_STORE_NOT_FOUND);
        err.status = 404;
        throw err;
    }
    if (!toStore) {
        const err = new Error(MESSAGES.STOCK.DEST_STORE_NOT_FOUND);
        err.status = 404;
        throw err;
    }

    const session = await mongoose.startSession();

    try {
        let result;

        await session.withTransaction(async () => {
            const sourceStock = await Stock.findOneAndUpdate(
                { product: productId, store: fromStoreId, quantity: { $gte: quantity } },
                { $inc: { quantity: -quantity } },
                { returnDocument: "after", session }
            );

            if (!sourceStock) {
                const err = new Error(MESSAGES.STOCK.INSUFFICIENT_STOCK);
                err.status = 422;
                throw err;
            }

            const destStock = await Stock.findOneAndUpdate(
                { product: productId, store: toStoreId },
                { $inc: { quantity: quantity } },
                { returnDocument: "after", session, upsert: true }
            );

            result = { sourceStock, destStock };
        });

        return result;
    } finally {
        await session.endSession();
    }
};

const getStockSummary = async () => {
    const [totalProducts, totalStores, stockList] = await Promise.all([
        Product.countDocuments(),
        Store.countDocuments(),
        Stock.find({}, "quantity"),
    ]);

    const lowStock = stockList.filter((s) => s.quantity > 0 && s.quantity <= 10).length;
    const outOfStock = stockList.filter((s) => s.quantity === 0).length;

    return { totalProducts, totalStores, lowStock, outOfStock };
};

export { createStock, getStock, adjustStock, transferStock, getStockSummary };
