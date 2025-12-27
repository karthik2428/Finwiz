// src/services/paymentCron.js
import cron from "node-cron";
import User from "../models/User.js";

let job = null;

export function startPaymentCron(cronSpec = "0 0 * * *") {
  // runs daily at midnight
  if (job) return;

  job = cron.schedule(cronSpec, async () => {
    const now = new Date();

    await User.updateMany(
      { "premium.isActive": true, "premium.expiryDate": { $lte: now } },
      { $set: { "premium.isActive": false } }
    );

    console.log("[PaymentCron] Expired premium accounts updated");
  });

  job.start();
}
