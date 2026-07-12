import express from "express";
import { createStock, getStock, adjustStock, transferStock, getStockSummary } from "../controllers/stockController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.get("/summary", protect, getStockSummary);
router.post("/", protect, authorizeRoles(ROLES.ADMIN), createStock);
router.get("/", protect, getStock);
router.patch("/adjust", protect, authorizeRoles(ROLES.ADMIN), adjustStock);
router.post("/transfer", protect, authorizeRoles(ROLES.ADMIN), transferStock);

export default router;
