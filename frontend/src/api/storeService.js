import axiosInstance from "./axiosInstance";

export const getStores = async () => {
    const response = await axiosInstance.get("/stores");
    return response.data;
};

export const createStore = async (payload) => {
    const response = await axiosInstance.post("/stores", payload);
    return response.data;
};
