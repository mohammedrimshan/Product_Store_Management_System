import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import Product from "../src/models/Product.js";
import Store from "../src/models/Store.js";
import Stock from "../src/models/Stock.js";

dotenv.config();

const seed = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    await User.deleteMany({});
    await Product.deleteMany({});
    await Store.deleteMany({});
    await Stock.deleteMany({});
    console.log("Cleared existing data");

    const adminPassword = await bcrypt.hash("admin123", 10);
    const shopperPassword = await bcrypt.hash("shopper123", 10);

    const [admin, shopper] = await User.insertMany([
        { name: "Admin User", email: "admin@example.com", password: adminPassword, role: "admin" },
        { name: "Shopper User", email: "shopper@example.com", password: shopperPassword, role: "shopper" },
    ]);
    console.log("Created users:", admin.email, shopper.email);

    const [laptop, headphones, keyboard] = await Product.insertMany([
        { name: "Laptop Pro 15", sku: "LAP-001" },
        { name: "Wireless Headphones", sku: "HDN-002" },
        { name: "Mechanical Keyboard", sku: "KBD-003" },
    ]);
    console.log("Created products");

    const [storeA, storeB, storeC] = await Store.insertMany([
        { name: "Downtown Branch", location: "123 Main St" },
        { name: "Airport Outlet", location: "Terminal 2" },
        { name: "Mall Store", location: "City Mall, Level 3" },
    ]);
    console.log("Created stores");

    await Stock.insertMany([
        { product: laptop._id,     store: storeA._id, quantity: 25  },
        { product: laptop._id,     store: storeB._id, quantity: 10  },
        { product: laptop._id,     store: storeC._id, quantity: 5   },
        { product: headphones._id, store: storeA._id, quantity: 50  },
        { product: headphones._id, store: storeB._id, quantity: 8   },
        { product: headphones._id, store: storeC._id, quantity: 0   },
        { product: keyboard._id,   store: storeA._id, quantity: 100 },
        { product: keyboard._id,   store: storeB._id, quantity: 3   },
        { product: keyboard._id,   store: storeC._id, quantity: 15  },
    ]);
    console.log("Created stock entries");

    console.log("\nSeed complete. Login credentials:");
    console.log("  Admin   → admin@example.com   / admin123");
    console.log("  Shopper → shopper@example.com / shopper123");

    await mongoose.disconnect();
    process.exit(0);
};

seed().catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
});
