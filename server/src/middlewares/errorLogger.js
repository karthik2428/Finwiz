// src/middlewares/errorLogger.js
import Log from "../models/Log.js";

export const errorLogger = async (err, req, res, next) => {
  console.error("ERROR:", err);

  try {
    await Log.create({
      level: "error",
      message: err.message || "Unhandled error",
      meta: {
        stack: err.stack,
        body: req.body,
        params: req.params,
        query: req.query,
      },
      route: req.originalUrl,
      method: req.method,
      user: req.user?._id || null,
      ip: req.ip,
    });
  } catch (logErr) {
    console.error("Error logging failed:", logErr.message);
  }

  next(err); // IMPORTANT
};
