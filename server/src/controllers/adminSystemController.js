// src/controllers/adminSystemController.js
import asyncHandler from "../middlewares/asyncHandler.js";
import os from "os";

const ensureAdmin = (req) => {
  if (req.user.role !== "admin") throw new Error("Admin only");
};

/**
 * GET /admin/system/status
 */
export const getSystemStatus = asyncHandler(async (req, res) => {
  ensureAdmin(req);

  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpuLoad: os.loadavg(),
    platform: os.platform()
  });
});

/**
 * GET /admin/system/ping
 */
export const ping = asyncHandler(async (req, res) => {
  ensureAdmin(req);
  res.json({ status: "ok", timestamp: Date.now() });
});
