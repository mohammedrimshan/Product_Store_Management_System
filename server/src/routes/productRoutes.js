import express from "express";
import { createProduct, getProducts } from "../controllers/productController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.post("/", protect, authorizeRoles(ROLES.ADMIN), createProduct);
router.get("/", protect, getProducts);

export default router;
