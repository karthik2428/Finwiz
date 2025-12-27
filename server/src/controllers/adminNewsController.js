// src/controllers/adminNewsController.js
import asyncHandler from "../middlewares/asyncHandler.js";
import NewsSetting from "../models/NewsSetting.js";
import { forceRefreshCategory, getCacheStats } from "../services/newsService.js";

/**
 * All admin controllers expect req.user.role === "admin"
 * Use protect middleware + role check in routes.
 */

export const listNewsSettings = asyncHandler(async (req, res) => {
  const settings = await NewsSetting.find({}).sort({ category: 1 });
  res.json({ settings });
});

export const updateNewsSetting = asyncHandler(async (req, res) => {
  const category = req.params.category;
  const { enabled, cacheTtlSeconds } = req.body;

  let s = await NewsSetting.findOne({ category });
  if (!s) {
    s = new NewsSetting({ category, enabled: !!enabled, cacheTtlSeconds: cacheTtlSeconds || 600 });
  } else {
    if (typeof enabled === "boolean") s.enabled = enabled;
    if (typeof cacheTtlSeconds === "number") s.cacheTtlSeconds = cacheTtlSeconds;
  }
  await s.save();
  res.json({ message: "News setting updated", setting: s });
});

export const refreshCategory = asyncHandler(async (req, res) => {
  const category = req.params.category;
  const result = await forceRefreshCategory(category);
  res.json({ message: "Category refreshed", fetchedCount: result.items.length });
});

export const cacheStats = asyncHandler(async (req, res) => {
  res.json({ stats: getCacheStats() });
});
