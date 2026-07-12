import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Product from "../src/models/Product.js";
import Store from "../src/models/Store.js";
import Stock from "../src/models/Stock.js";

dotenv.config();

const TEST_DB = (process.env.MONGO_URI || "mongodb://localhost:27017/product_store").replace(
    /\/([^/?]+)(\?|$)/,
    "/$1_test$2"
);

let adminToken;
let shopperToken;
let productId;
let storeAId;
let storeBId;

beforeAll(async () => {
    await mongoose.connect(TEST_DB);

    await Promise.all([
        User.deleteMany({}),
        Product.deleteMany({}),
        Store.deleteMany({}),
        Stock.deleteMany({}),
    ]);

    const hashed = await bcrypt.hash("testpass123", 10);
    await User.create({ name: "Test Admin", email: "admin@test.com", password: hashed, role: "admin" });

    const adminLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: "admin@test.com", password: "testpass123" });
    adminToken = adminLogin.body.data.token;

    await request(app)
        .post("/api/auth/register")
        .send({ name: "Test Shopper", email: "shopper@test.com", password: "testpass123" });

    const shopperLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: "shopper@test.com", password: "testpass123" });
    shopperToken = shopperLogin.body.data.token;

    const product = await Product.create({ name: "Test Widget", sku: "TST-001" });
    productId = product._id.toString();

    const storeA = await Store.create({ name: "Store Alpha" });
    const storeB = await Store.create({ name: "Store Beta" });
    storeAId = storeA._id.toString();
    storeBId = storeB._id.toString();
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
});

beforeEach(async () => {
    await Stock.deleteMany({});
    await Stock.create({ product: productId, store: storeAId, quantity: 100 });
    await Stock.create({ product: productId, store: storeBId, quantity: 0 });
});

describe("Stock Adjustment", () => {
    test("rejects adjustment that would drive stock below zero", async () => {
        const res = await request(app)
            .patch("/api/stock/adjust")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ productId, storeId: storeAId, delta: -200 });

        expect(res.status).toBe(422);
        expect(res.body.success).toBe(false);

        const stock = await Stock.findOne({ product: productId, store: storeAId });
        expect(stock.quantity).toBe(100);
    });

    test("positive adjustment increases stock", async () => {
        const res = await request(app)
            .patch("/api/stock/adjust")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ productId, storeId: storeAId, delta: 50 });

        expect(res.status).toBe(200);
        expect(res.body.data.quantity).toBe(150);
    });

    test("rejects zero delta", async () => {
        const res = await request(app)
            .patch("/api/stock/adjust")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ productId, storeId: storeAId, delta: 0 });

        expect(res.status).toBe(400);
    });

    test("shopper cannot adjust stock", async () => {
        const res = await request(app)
            .patch("/api/stock/adjust")
            .set("Authorization", `Bearer ${shopperToken}`)
            .send({ productId, storeId: storeAId, delta: 10 });

        expect(res.status).toBe(403);
    });

    test("concurrent decrements never drive stock below zero", async () => {
        const INITIAL = 100;
        const REQUESTS = 120;

        const results = await Promise.all(
            Array.from({ length: REQUESTS }, () =>
                request(app)
                    .patch("/api/stock/adjust")
                    .set("Authorization", `Bearer ${adminToken}`)
                    .send({ productId, storeId: storeAId, delta: -1 })
            )
        );

        const successes = results.filter((r) => r.status === 200).length;
        const failures = results.filter((r) => r.status === 422).length;

        expect(successes).toBe(INITIAL);
        expect(failures).toBe(REQUESTS - INITIAL);

        const stock = await Stock.findOne({ product: productId, store: storeAId });
        expect(stock.quantity).toBe(0);
    }, 30000);
});

describe("Stock Transfer", () => {
    test("successful transfer decrements source and increments destination", async () => {
        const AMOUNT = 30;

        const res = await request(app)
            .post("/api/stock/transfer")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ productId, fromStoreId: storeAId, toStoreId: storeBId, quantity: AMOUNT });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const source = await Stock.findOne({ product: productId, store: storeAId });
        const dest = await Stock.findOne({ product: productId, store: storeBId });

        expect(source.quantity).toBe(100 - AMOUNT);
        expect(dest.quantity).toBe(AMOUNT);
    });

    test("rejects transfer that exceeds available source stock", async () => {
        const res = await request(app)
            .post("/api/stock/transfer")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ productId, fromStoreId: storeAId, toStoreId: storeBId, quantity: 999 });

        expect(res.status).toBe(422);
        expect(res.body.success).toBe(false);

        const source = await Stock.findOne({ product: productId, store: storeAId });
        const dest = await Stock.findOne({ product: productId, store: storeBId });

        expect(source.quantity).toBe(100);
        expect(dest.quantity).toBe(0);
    });

    test("rejects transfer to the same store", async () => {
        const res = await request(app)
            .post("/api/stock/transfer")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ productId, fromStoreId: storeAId, toStoreId: storeAId, quantity: 10 });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test("rejects transfer with non-positive quantity", async () => {
        const zero = await request(app)
            .post("/api/stock/transfer")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ productId, fromStoreId: storeAId, toStoreId: storeBId, quantity: 0 });

        const negative = await request(app)
            .post("/api/stock/transfer")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ productId, fromStoreId: storeAId, toStoreId: storeBId, quantity: -5 });

        expect(zero.status).toBe(400);
        expect(negative.status).toBe(400);
    });

    test("shopper cannot transfer stock", async () => {
        const res = await request(app)
            .post("/api/stock/transfer")
            .set("Authorization", `Bearer ${shopperToken}`)
            .send({ productId, fromStoreId: storeAId, toStoreId: storeBId, quantity: 10 });

        expect(res.status).toBe(403);
    });
});

describe("Auth", () => {
    test("rejects unauthenticated request to protected route", async () => {
        const res = await request(app).get("/api/products");
        expect(res.status).toBe(401);
    });

    test("rejects invalid credentials on login", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "admin@test.com", password: "wrongpassword" });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });
});
