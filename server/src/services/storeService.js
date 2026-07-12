import Store from "../models/Store.js";

const createStore = async ({ name, location }) => {
    const store = await Store.create({ name, location });
    return store;
};

const getStores = async () => {
    return Store.find().sort({ createdAt: -1 });
};

export { createStore, getStores };
