import { createSlice } from "@reduxjs/toolkit";

const storedUser = localStorage.getItem("user");
const storedToken = localStorage.getItem("token");

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: storedUser ? JSON.parse(storedUser) : null,
        token: storedToken || null,
        isAuthenticated: !!storedToken,
    },
    reducers: {
        setCredentials: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
        },
        clearCredentials: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
        },
    },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
