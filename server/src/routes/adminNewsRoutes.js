// src/routes/adminNewsRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  listNewsSettings,
  updateNewsSetting,
  refreshCategory,
  cacheStats
} from "../controllers/adminNewsController.js";

/**
 * Simple admin role-check middleware
 */
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Admin only" });
  next();
};

const router = express.Router();
router.use(protect, adminOnly);

router.get("/settings", listNewsSettings);
router.put("/settings/:category", updateNewsSetting);
router.post("/refresh/:category", refreshCategory);
router.get("/cache/stats", cacheStats);

export default router;
