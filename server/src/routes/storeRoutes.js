import express from "express";
import { createStore, getStores } from "../controllers/storeController.js";
import protect from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.post("/", protect, authorizeRoles(ROLES.ADMIN), createStore);
router.get("/", protect, getStores);

export default router;
