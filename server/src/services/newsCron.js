// src/services/newsCron.js
/**
 * newsCron.js
 *
 * Periodically refreshes enabled categories' first page.
 * Use a cron schedule (e.g., every 10 minutes or hourly) based on your rate limits.
 *
 * This is a simple global scheduler; for scale, move to queue-based workers.
 */

import cron from "node-cron";
import NewsSetting from "../models/NewsSetting.js";
import { forceRefreshCategory } from "./newsService.js";

let job = null;

/**
 * Start cron job with a cronSpec (default every 30 minutes)
 */
export function startNewsCron(cronSpec = process.env.NEWS_CRON || "*/30 * * * *") {
  if (job) return;
  job = cron.schedule(cronSpec, async () => {
    try {
      const enabled = await NewsSetting.find({ enabled: true });
      for (const s of enabled) {
        try {
          await forceRefreshCategory(s.category);
          console.log(`[newsCron] refreshed category=${s.category}`);
        } catch (err) {
          console.error("[newsCron] refresh error for", s.category, err.message || err);
        }
      }
    } catch (err) {
      console.error("[newsCron] job failed", err);
    }
  }, { scheduled: true });
  job.start();
  console.log("[newsCron] started with spec:", cronSpec);
}

export function stopNewsCron() {
  if (!job) return;
  job.stop();
  job.destroy();
  job = null;
  console.log("[newsCron] stopped");
}
