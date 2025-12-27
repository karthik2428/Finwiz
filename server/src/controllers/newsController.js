// src/controllers/newsController.js
import asyncHandler from "../middlewares/asyncHandler.js";
import { fetchNews } from "../services/newsService.js";

/**
 * GET /news?category=markets&page=1&pageSize=20
 * Public endpoint (requires auth via protect middleware in routes)
 */
export const getNews = asyncHandler(async (req, res) => {
  const category = req.query.category || "markets";
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(50, Math.max(5, Number(req.query.pageSize || 20)));
  const force = req.query.force === "true"; // admin / debug can force refresh if allowed

  const result = await fetchNews(category, page, pageSize, force);
  res.json(result);
});
