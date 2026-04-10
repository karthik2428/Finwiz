import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  getNews,
  getAvailableCategories
} from "../controllers/newsController.js";

const router = express.Router();

/* ========================================
   All user news routes require auth
======================================== */
router.use(protect);

/**
 * GET /api/news/available-categories
 */
router.get("/available-categories", getAvailableCategories);

/**
 * GET /api/news?category=markets&page=1&pageSize=20
 */
router.get("/", getNews);

export default router;