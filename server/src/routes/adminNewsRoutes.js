import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  listNewsSettings,
  updateNewsSetting,
  refreshCategory,
  cacheStats
} from "../controllers/adminNewsController.js";

/**
 * Admin-only middleware
 */
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

const router = express.Router();

/* =========================================
   Apply protection to all admin routes
========================================= */
router.use(protect);
router.use(adminOnly);

/* =========================================
   Category Management
========================================= */

/**
 * GET /api/admin/news/categories
 * Returns all categories (merged master + DB)
 */
router.get("/categories", listNewsSettings);

/**
 * PUT /api/admin/news/categories/:category
 * Update enable/disable or TTL
 */
router.put("/categories/:category", updateNewsSetting);

/**
 * POST /api/admin/news/categories/:category/refresh
 * Force refresh category cache
 */
router.post("/categories/:category/refresh", refreshCategory);

/* =========================================
   Diagnostics
========================================= */

/**
 * GET /api/admin/news/cache/stats
 */
router.get("/cache/stats", cacheStats);

export default router;