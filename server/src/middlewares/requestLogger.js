// src/middlewares/requestLogger.js
import Log from "../models/Log.js";

/**
 * Logs every request:
 * - method
 * - route
 * - status code
 * - user ID
 * - IP
 * - execution time
 */
export const requestLogger = async (req, res, next) => {
  const start = Date.now();

  res.on("finish", async () => {
    const duration = Date.now() - start;

    try {
      await Log.create({
        level: "info",
        message: "API Request",
        route: req.originalUrl,
        method: req.method,
        statusCode: res.statusCode,
        ip: req.ip,
        user: req.user?._id || null,
        durationMs: duration
      });
    } catch (err) {
      console.error("Logging failed:", err.message);
    }
  });

  next();
};
