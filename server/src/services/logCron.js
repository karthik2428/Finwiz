// src/services/logCron.js
import cron from "node-cron";
import Log from "../models/Log.js";
import { getConfigKey } from "./configService.js";

let job = null;

export function startLogCron(cronSpec = "0 3 * * *") {
  // default: every day at 3 AM
  if (job) return;

  job = cron.schedule(cronSpec, async () => {
    console.log("[LogCron] Starting cleanup job");

    try {
      const days = await getConfigKey("system.logRetentionDays") || 30;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const result = await Log.deleteMany({ createdAt: { $lte: cutoff } });

      console.log(`[LogCron] Deleted ${result.deletedCount} old logs`);
    } catch (err) {
      console.error("[LogCron] Error:", err.message);
    }

    console.log("[LogCron] Finished");
  });

  job.start();
}
