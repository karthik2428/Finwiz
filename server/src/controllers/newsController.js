import asyncHandler from "../middlewares/asyncHandler.js";
import { fetchNews } from "../services/newsService.js";
import NewsSetting from "../models/NewsSetting.js";
import { NEWS_CATEGORIES } from "../constants/newsCategories.js";

/**
 * GET /api/news?category=markets&page=1&pageSize=20
 */
export const getNews = asyncHandler(async (req, res) => {
  const category = req.query.category || "markets";
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(50, Math.max(5, Number(req.query.pageSize || 20)));
  const force = req.query.force === "true";

  const result = await fetchNews(category, page, pageSize, force);
  res.json(result);
});

/**
 * GET /api/news/available-categories
 * Returns only enabled categories
 */
export const getAvailableCategories = asyncHandler(async (req, res) => {
  const enabledSettings = await NewsSetting.find({ enabled: true }).select("category");

  const enabledCategories = enabledSettings.map((s) => s.category);

  // If DB empty (first run), fallback to master list
  const categories =
    enabledCategories.length > 0 ? enabledCategories : NEWS_CATEGORIES;

  res.json({ categories });
});