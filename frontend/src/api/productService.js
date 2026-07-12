import axiosInstance from "./axiosInstance";

export const getProducts = async () => {
    const response = await axiosInstance.get("/products");
    return response.data;
};

export const createProduct = async (payload) => {
    const response = await axiosInstance.post("/products", payload);
    return response.data;
};
