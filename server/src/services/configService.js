// src/services/configService.js
import Config from "../models/Config.js";

let CONFIG_CACHE = {};
let LAST_FETCH = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Default configuration
 * Applied if DB does not have values yet.
 */
const DEFAULT_CONFIG = {
  subscription: {
    merchantSimilarity: 0.8,
    recurringDaysTolerance: 3,
    priceCreepPercent: 10,
  },

  forecast: {
    wmaWeights: [1, 2, 3],
  },

  goalModel: {
    difficultyWeightAmount: 0.4,
    difficultyWeightDuration: 0.3,
    difficultyWeightSavingsRate: 0.3,
  },

  recommendation: {
    minCagrPercent: 5,
    maxVolatility: 5,
  },

  premium: {
    monthlyPrice: 99,
    yearlyPrice: 999,
  },

  pdf: {
    footerText: "FinWiz — Privacy-Safe Financial Advisor",
    logoUrl: null,
  },
};

/**
 * Load config from DB and merge with defaults
 */
async function loadConfig() {
  const rows = await Config.find({});
  const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));

  rows.forEach((r) => {
    const parts = r.key.split(".");
    let pointer = config;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!pointer[parts[i]]) pointer[parts[i]] = {};
      pointer = pointer[parts[i]];
    }

    pointer[parts[parts.length - 1]] = r.value;
  });

  CONFIG_CACHE = config;
  LAST_FETCH = Date.now();
}

/**
 * Public: Get config (cached)
 */
export async function getConfig() {
  const now = Date.now();
  if (now - LAST_FETCH > CACHE_TTL_MS) {
    await loadConfig();
  }
  return CONFIG_CACHE;
}

/**
 * Public: Update config value
 */
export async function updateConfig(key, value, description = "") {
  const row = await Config.findOneAndUpdate(
    { key },
    { value, description },
    { upsert: true, new: true }
  );
  await loadConfig();
  return row;
}

/**
 * Public: get specific key (nested)
 */
export async function getConfigKey(path) {
  const config = await getConfig();
  return path.split(".").reduce((p, c) => (p ? p[c] : undefined), config);
}
