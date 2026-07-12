import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";
import * as stockService from "../services/stockService.js";

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

        const stock = await stockService.createStock({ productId, storeId, quantity });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: MESSAGES.STOCK.CREATED,
            data: stock,
        });
    } catch (error) {
        const status = error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
        res.status(status).json({ success: false, message: error.message });
    }
};

const getStock = async (req, res) => {
    try {
        const { threshold } = req.query;
        const stocks = await stockService.getStock({ threshold });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: MESSAGES.STOCK.FETCHED,
            data: stocks,
        });
    } catch (error) {
        const status = error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
        res.status(status).json({ success: false, message: error.message });
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

        const updated = await stockService.adjustStock({ productId, storeId, delta });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: MESSAGES.STOCK.ADJUSTED,
            data: updated,
        });
    } catch (error) {
        const status = error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
        res.status(status).json({ success: false, message: error.message });
    }
};

const transferStock = async (req, res) => {
    try {
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

        const result = await stockService.transferStock({ productId, fromStoreId, toStoreId, quantity });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: MESSAGES.STOCK.TRANSFERRED,
            data: result,
        });
    } catch (error) {
        const status = error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
        res.status(status).json({ success: false, message: error.message });
    }
};

const getStockSummary = async (req, res) => {
    try {
        const summary = await stockService.getStockSummary();
        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: MESSAGES.STOCK.SUMMARY_FETCHED,
            data: summary,
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
};

export { createStock, getStock, adjustStock, transferStock, getStockSummary };
