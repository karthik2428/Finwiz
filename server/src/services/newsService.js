// src/services/newsService.js
/**
 * newsService.js
 *
 * Responsibilities:
 * - Query MarketAux (or other configured news API)
 * - Cache responses in-memory using node-cache
 * - Provide fetchNews(category, page, pageSize, forceRefresh)
 *
 * Environment:
 * - process.env.MARKETAUX_API_KEY (required)
 * - process.env.MARKETAUX_BASE_URL (optional; default placeholder)
 *
 * NOTES:
 * - MarketAux has rate limits — keep cache enabled.
 * - If you want persistent caching, extend to store articles in DB.
 */

import axios from "axios";
import NodeCache from "node-cache";
import NewsSetting from "../models/NewsSetting.js";
import dotenv from "dotenv";
dotenv.config();


const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // default TTL 10m

const MARKET_AUX_BASE = process.env.MARKETAUX_BASE_URL || "https://api.marketaux.com/v1"; // example base
const API_KEY = process.env.MARKETAUX_API_KEY || "";

if (!API_KEY) {
  console.warn("[newsService] MARKETAUX_API_KEY not set — external news calls will fail until provided.");
}

/**
 * composeMarketAuxUrl - build URL for category and paging
 * Adjust query params to match actual MarketAux API (this is a template)
 */
function composeMarketAuxUrl(category, page = 1, pageSize = 20) {
  // Example endpoint: /news/all?categories=general&language=en&page=1
  // Replace/adjust query param names per MarketAux docs when integrating.
  const params = new URLSearchParams({
    api_token: API_KEY,
    language: "en",
    page: String(page),
    page_size: String(pageSize),
    categories: category
  });
  return `${MARKET_AUX_BASE}/news/all?${params.toString()}`;
}

/**
 * fetchNewsFromApi - calls external API and returns item array
 */
async function fetchNewsFromApi(category, page = 1, pageSize = 20) {
  const url = composeMarketAuxUrl(category, page, pageSize);
  const resp = await axios.get(url, { timeout: 10000 });
  // transform response depending on MarketAux shape
  // expected shape example: { data: [ { title, description, url, published_at, source, image_url }, ... ], meta: {...} }
  const data = resp.data?.data || resp.data?.articles || [];
  return data.map(item => ({
    id: item.id || item.url,
    title: item.title || item.headline || "",
    summary: item.description || item.summary || "",
    url: item.url || item.link || "",
    publishedAt: item.published_at ? new Date(item.published_at) : (item.publishedAt ? new Date(item.publishedAt) : new Date()),
    source: item.source_name || item.source || "",
    imageUrl: item.image_url || item.image || null,
    raw: item
  }));
}

/**
 * Public: fetchNews
 * - Uses category-level settings to decide caching TTL
 * - Returns { items: [], meta: { page, pageSize, total? } }
 */
export async function fetchNews(category = "markets", page = 1, pageSize = 20, forceRefresh = false) {
  // check if category is enabled
  const setting = await NewsSetting.findOne({ category });
  if (setting && !setting.enabled && !forceRefresh) {
    return { items: [], meta: { page, pageSize, total: 0, enabled: false } };
  }

  const cacheKey = `news::${category}::${page}::${pageSize}`;
  if (!forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached) return { items: cached.items, meta: { page, pageSize, cached: true } };
  }

  // call external API
  try {
    const items = await fetchNewsFromApi(category, page, pageSize);

    // push to cache using TTL from setting or default
    const ttl = (setting?.cacheTtlSeconds) || cache.options.stdTTL || 600;
    cache.set(cacheKey, { items }, ttl);

    // update lastFetchedAt
    if (setting) {
      setting.lastFetchedAt = new Date();
      await setting.save();
    }

    return { items, meta: { page, pageSize, cached: false } };
  } catch (err) {
    console.error("[newsService] fetch failed:", err.message || err);
    // if cache present, return stale cache
    const cached = cache.get(cacheKey);
    if (cached) return { items: cached.items, meta: { page, pageSize, cached: true, stale: true } };

    // Fallback to mock data if API fails (so user sees something)
    const mockItems = [
      {
        id: 'mock-1',
        title: "Global Markets Rally on Tech Earnings",
        summary: "Major indices hit record highs as technology sector exceeds quarterly expectations.",
        url: "#",
        publishedAt: new Date(),
        source: "FinWiz News",
        imageUrl: "https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: 'mock-2',
        title: "Central Bank Signals Rate Cuts",
        summary: "Economic data suggests inflation is cooling, prompting discussions of potential interest rate reductions.",
        url: "#",
        publishedAt: new Date(),
        source: "FinWiz News",
        imageUrl: "https://images.unsplash.com/photo-1565514020176-dbf2277e4954?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: 'mock-3',
        title: "Cryptocurrency Volatility Continues",
        summary: "Bitcoin and Ethereum see sharp movements as regulatory concerns resurface in major markets.",
        url: "#",
        publishedAt: new Date(),
        source: "FinWiz News",
        imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=800&q=80"
      }
    ];
    return { items: mockItems, meta: { page, pageSize, cached: false, description: "Mock Data (API Failed)" } };
  }
}

/**
 * forceRefreshCategory - clears cache for the category (all pages) and refetches page 1
 */
export async function forceRefreshCategory(category = "markets") {
  const keys = cache.keys().filter(k => k.startsWith(`news::${category}::`));
  for (const k of keys) cache.del(k);
  // fetch page 1 fresh
  return fetchNews(category, 1, 20, true);
}

/**
 * expose cache stats for diagnostics
 */
export function getCacheStats() {
  return cache.getStats ? cache.getStats() : { keys: cache.keys().length };
}
