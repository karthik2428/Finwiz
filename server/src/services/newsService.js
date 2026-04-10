/**
 * newsService.js
 *
 * Responsibilities:
 * - Query MarketAux
 * - Cache responses using node-cache
 * - Validate category via master list
 * - Respect admin enable/disable
 * - Per-category TTL
 */

import axios from "axios";
import NodeCache from "node-cache";
import dotenv from "dotenv";
import NewsSetting from "../models/NewsSetting.js";
import { NEWS_CATEGORIES } from "../constants/newsCategories.js";

dotenv.config();

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const MARKET_AUX_BASE =
  process.env.MARKETAUX_BASE_URL || "https://api.marketaux.com/v1";

const API_KEY = process.env.MARKETAUX_API_KEY || "";

if (!API_KEY) {
  console.warn(
    "[newsService] MARKETAUX_API_KEY not set — external news calls will fail."
  );
}

/* ======================================================
   Helper: Validate Category
====================================================== */
function validateCategory(category) {
  const normalized = category?.toLowerCase().trim();

  if (!NEWS_CATEGORIES.includes(normalized)) {
    throw new Error("Invalid news category");
  }

  return normalized;
}

/* ======================================================
   Compose MarketAux URL
====================================================== */
function composeMarketAuxUrl(category, page = 1, pageSize = 20) {
  const params = new URLSearchParams({
    api_token: API_KEY,
    language: "en",
    page: String(page),
    page_size: String(pageSize),
    categories: category
  });

  return `${MARKET_AUX_BASE}/news/all?${params.toString()}`;
}

/* ======================================================
   Fetch From External API
====================================================== */
async function fetchNewsFromApi(category, page, pageSize) {
  const url = composeMarketAuxUrl(category, page, pageSize);
  const resp = await axios.get(url, { timeout: 10000 });

  const data = resp.data?.data || resp.data?.articles || [];

  return data.map((item) => ({
    id: item.id || item.url,
    title: item.title || item.headline || "",
    summary: item.description || item.summary || "",
    url: item.url || item.link || "",
    publishedAt: item.published_at
      ? new Date(item.published_at)
      : new Date(),
    source: item.source_name || item.source || "",
    imageUrl: item.image_url || item.image || null,
    raw: item
  }));
}

/* ======================================================
   Ensure Setting Exists (Auto-create)
====================================================== */
async function ensureSetting(category) {
  let setting = await NewsSetting.findOne({ category });

  if (!setting) {
    setting = await NewsSetting.create({
      category,
      enabled: true,
      cacheTtlSeconds: 600
    });
  }

  return setting;
}

/* ======================================================
   PUBLIC: fetchNews
====================================================== */
export async function fetchNews(
  category = "markets",
  page = 1,
  pageSize = 20,
  forceRefresh = false
) {
  category = validateCategory(category);

  page = Math.max(1, Number(page));
  pageSize = Math.min(50, Math.max(5, Number(pageSize)));

  const setting = await ensureSetting(category);

  if (!setting.enabled && !forceRefresh) {
    return {
      items: [],
      meta: {
        page,
        pageSize,
        enabled: false,
        message: "Category disabled by admin"
      }
    };
  }

  const cacheKey = `news::${category}::${page}::${pageSize}`;

  if (!forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached) {
      return {
        items: cached.items,
        meta: { page, pageSize, cached: true }
      };
    }
  }

  try {
    const items = await fetchNewsFromApi(category, page, pageSize);

    const ttl =
      setting.cacheTtlSeconds > 0
        ? setting.cacheTtlSeconds
        : cache.options.stdTTL;

    cache.set(cacheKey, { items }, ttl);

    setting.lastFetchedAt = new Date();
    await setting.save();

    return {
      items,
      meta: { page, pageSize, cached: false }
    };
  } catch (err) {
    console.error("[newsService] External fetch failed:", err.message);

    const cached = cache.get(cacheKey);
    if (cached) {
      return {
        items: cached.items,
        meta: { page, pageSize, cached: true, stale: true }
      };
    }

    // Controlled fallback
    return {
      items: [],
      meta: {
        page,
        pageSize,
        error: "News service temporarily unavailable"
      }
    };
  }
}

/* ======================================================
   FORCE REFRESH
====================================================== */
export async function forceRefreshCategory(category = "markets") {
  category = validateCategory(category);

  const keys = cache
    .keys()
    .filter((k) => k.startsWith(`news::${category}::`));

  keys.forEach((k) => cache.del(k));

  return fetchNews(category, 1, 20, true);
}

/* ======================================================
   CACHE STATS
====================================================== */
export function getCacheStats() {
  return {
    keys: cache.keys().length,
    stats: cache.getStats ? cache.getStats() : {}
  };
}