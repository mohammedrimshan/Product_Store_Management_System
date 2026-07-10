import axiosInstance from "./axiosInstance";

export const registerUser = async ({ name, email, password }) => {
    const response = await axiosInstance.post("/auth/register", { name, email, password });
    return response.data;
};

export const loginUser = async ({ email, password }) => {
    const response = await axiosInstance.post("/auth/login", { email, password });
    return response.data;
};

export const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};