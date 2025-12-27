// src/controllers/adminLogController.js
import asyncHandler from "../middlewares/asyncHandler.js";
import Log from "../models/Log.js";

const ensureAdmin = (req) => {
  if (req.user.role !== "admin") throw new Error("Admin only");
};

/**
 * GET /admin/logs?level=error&limit=100
 */
export const getLogs = asyncHandler(async (req, res) => {
  ensureAdmin(req);

  const level = req.query.level;
  const limit = Number(req.query.limit) || 100;

  const query = {};
  if (level) query.level = level;

  const logs = await Log.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({ logs });
});

/**
 * DELETE /admin/logs/old?days=30
 */
export const deleteOldLogs = asyncHandler(async (req, res) => {
  ensureAdmin(req);

  const days = Number(req.query.days || 30);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await Log.deleteMany({ createdAt: { $lte: cutoff } });

  res.json({ message: "Old logs deleted", deletedCount: result.deletedCount });
});
