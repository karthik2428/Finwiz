// src/models/NewsSetting.js
import mongoose from "mongoose";

/**
 * NewsSetting:
 * - category: e.g., "markets", "mutual-funds", "economy", "crypto"
 * - enabled: whether to fetch & show to users
 * - lastFetchedAt: timestamp of last successful fetch
 * - cacheTtlSeconds: optional per-category TTL (fallback to global)
 */
const NewsSettingSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: true },
  lastFetchedAt: { type: Date },
  cacheTtlSeconds: { type: Number, default: 600 } // 10 minutes default
}, { timestamps: true });

const NewsSetting = mongoose.model("NewsSetting", NewsSettingSchema);
export default NewsSetting;
