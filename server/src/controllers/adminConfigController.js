// src/controllers/adminConfigController.js
import asyncHandler from "../middlewares/asyncHandler.js";
import { getConfig, updateConfig } from "../services/configService.js";

const ensureAdmin = (user) => {
  if (user.role !== "admin") throw new Error("Admin only");
};

/**
 * GET /admin/config
 */
export const getAllConfig = asyncHandler(async (req, res) => {
  ensureAdmin(req.user);
  const config = await getConfig();
  res.json({ config });
});

/**
 * PUT /admin/config
 * Body example:
 * {
 *   "subscription.merchantSimilarity": 0.85,
 *   "forecast.wmaWeights": [2,3,5]
 * }
 */
export const updateConfigValues = asyncHandler(async (req, res) => {
  ensureAdmin(req.user);

  const updates = req.body;
  const results = [];

  for (const key of Object.keys(updates)) {
    const value = updates[key];
    const row = await updateConfig(key, value);
    results.push(row);
  }

  res.json({ message: "Config updated", results });
});
