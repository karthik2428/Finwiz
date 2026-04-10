import mongoose from "mongoose";
import { NEWS_CATEGORIES } from "../constants/newsCategories.js";

/**
 * NewsSetting:
 * - category: predefined category from master list
 * - enabled: whether to fetch & show to users
 * - lastFetchedAt: timestamp of last successful fetch
 * - cacheTtlSeconds: optional per-category TTL (fallback to global)
 */

const NewsSettingSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      enum: NEWS_CATEGORIES
    },

    enabled: {
      type: Boolean,
      default: true
    },

    lastFetchedAt: {
      type: Date
    },

    cacheTtlSeconds: {
      type: Number,
      default: 600,
      min: 60
    }
  },
  { timestamps: true }
);

/* ---------------------------
   Indexes for performance
---------------------------- */
NewsSettingSchema.index({ category: 1 });
NewsSettingSchema.index({ enabled: 1 });

/* ---------------------------
   Static helper (optional)
---------------------------- */
NewsSettingSchema.statics.getEnabledCategories = function () {
  return this.find({ enabled: true }).select("category");
};

const NewsSetting = mongoose.model("NewsSetting", NewsSettingSchema);

export default NewsSetting;