import asyncHandler from "../middlewares/asyncHandler.js";
import NewsSetting from "../models/NewsSetting.js";
import { forceRefreshCategory, getCacheStats } from "../services/newsService.js";
import { NEWS_CATEGORIES } from "../constants/newsCategories.js";

/**
 * All admin controllers expect req.user.role === "admin"
 */

/* ======================================================
   LIST ALL NEWS SETTINGS (Merge Master + DB)
====================================================== */
export const listNewsSettings = asyncHandler(async (req, res) => {
  const existingSettings = await NewsSetting.find({});

  // Create lookup map
  const map = {};
  existingSettings.forEach((s) => {
    map[s.category] = s;
  });

  // Merge with master category list
  const fullList = NEWS_CATEGORIES.map((category) => {
    const setting = map[category];

    if (setting) {
      return {
        category: setting.category,
        enabled: setting.enabled,
        cacheTtlSeconds: setting.cacheTtlSeconds,
        lastFetchedAt: setting.lastFetchedAt || null
      };
    }

    // default if not created yet
    return {
      category,
      enabled: true,
      cacheTtlSeconds: 600,
      lastFetchedAt: null
    };
  });

  res.json({ settings: fullList });
});

/* ======================================================
   UPDATE NEWS SETTING
====================================================== */
export const updateNewsSetting = asyncHandler(async (req, res) => {
  let category = req.params.category?.toLowerCase().trim();

  if (!NEWS_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: "Invalid news category" });
  }

  const { enabled, cacheTtlSeconds } = req.body;

  let setting = await NewsSetting.findOne({ category });

  if (!setting) {
    setting = new NewsSetting({
      category,
      enabled: typeof enabled === "boolean" ? enabled : true,
      cacheTtlSeconds:
        typeof cacheTtlSeconds === "number" && cacheTtlSeconds > 0
          ? cacheTtlSeconds
          : 600
    });
  } else {
    if (typeof enabled === "boolean") {
      setting.enabled = enabled;
    }

    if (
      typeof cacheTtlSeconds === "number" &&
      cacheTtlSeconds > 0
    ) {
      setting.cacheTtlSeconds = cacheTtlSeconds;
    }
  }

  await setting.save();

  res.json({
    message: "News setting updated successfully",
    setting
  });
});

/* ======================================================
   FORCE REFRESH CATEGORY
====================================================== */
export const refreshCategory = asyncHandler(async (req, res) => {
  let category = req.params.category?.toLowerCase().trim();

  if (!NEWS_CATEGORIES.includes(category)) {
    return res.status(400).json({ message: "Invalid news category" });
  }

  const result = await forceRefreshCategory(category);

  res.json({
    message: "Category refreshed successfully",
    fetchedCount: result.items.length
  });
});

/* ======================================================
   CACHE STATS
====================================================== */
export const cacheStats = asyncHandler(async (req, res) => {
  res.json({ stats: getCacheStats() });
});