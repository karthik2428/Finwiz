// src/models/Log.js
import mongoose from "mongoose";

const LogSchema = new mongoose.Schema(
  {
    level: { type: String, enum: ["info", "warn", "error"], required: true },
    message: { type: String, required: true },

    // Contextual meta information
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Request context
    route: { type: String },
    method: { type: String },
    statusCode: { type: Number },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ip: { type: String },
    durationMs: { type: Number },
  },
  { timestamps: true }
);

const Log = mongoose.model("Log", LogSchema);
export default Log;
