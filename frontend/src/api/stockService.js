import axiosInstance from "./axiosInstance";

export const getStock = async (threshold) => {
    const params = threshold !== undefined ? { threshold } : {};
    const response = await axiosInstance.get("/stock", { params });
    return response.data;
};

export const createStock = async (payload) => {
    const response = await axiosInstance.post("/stock", payload);
    return response.data;
};

export const adjustStock = async (payload) => {
    const response = await axiosInstance.patch("/stock/adjust", payload);
    return response.data;
};

export const transferStock = async (payload) => {
    const response = await axiosInstance.post("/stock/transfer", payload);
    return response.data;
};

export const getStockSummary = async () => {
    const response = await axiosInstance.get("/stock/summary");
    return response.data;
};
