import { HTTP_STATUS } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.js";
import * as storeService from "../services/storeService.js";

const createStore = async (req, res) => {
    try {
        const { name, location } = req.body;

        if (!name) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: MESSAGES.STORE.NAME_REQUIRED,
            });
        }

        const store = await storeService.createStore({ name, location });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: MESSAGES.STORE.CREATED,
            data: store,
        });
    } catch (error) {
        const status = error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
        res.status(status).json({ success: false, message: error.message });
    }
};

const getStores = async (req, res) => {
    try {
        const stores = await storeService.getStores();
        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: MESSAGES.STORE.FETCHED,
            data: stores,
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
        });
    }
};

export { createStore, getStores };
