// src/services/cronService.js
/**
 * cronService.js
 * Provides a simple cron manager to schedule daily subscription scans per user.
 * For demo/POC, we run a single global job that iterates active users and triggers detection.
 *
 * In production, prefer a queue system (Bull/Redis) and process per-user tasks to avoid timeouts.
 */

import cron from "node-cron";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Subscription from "../models/Subscription.js";
import { detectSubscriptionsFromTransactions } from "../utils/subscriptionDetector.js";

/* Global job handle */
let subscriptionScanJob = null;

/* function to run a single user's scan (similar to controller but internal) */
async function runScanForUser(userId, lookbackMonths = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - lookbackMonths);
  const txs = await Transaction.find({ createdBy: userId, kind: "expense", date: { $gte: since }}).sort({ date: 1 });
  const detected = detectSubscriptionsFromTransactions(txs, {
    nameSimilarityThreshold: 0.8, minPayments: 3, recurrenceToleranceDays: 5, amountVariationPct: 0.25, priceCreepWindow: 4, priceCreepPct: 0.08
  });

  for (const d of detected) {
    const existing = await Subscription.findOne({ user: userId, merchantSignature: d.merchantSignature });
    const paymentRecords = d.payments.map(p => ({ date: p.date, amount: p.amount, txId: p.txId }));
    if (existing) {
      existing.title = d.title;
      existing.avgAmount = d.avgAmount;
      existing.amountStdDev = d.amountStdDev;
      existing.recurrenceDays = d.recurrenceDays;
      existing.recurrenceStdDev = d.recurrenceStdDev;
      existing.lastPayments = paymentRecords;
      existing.estimatedNextDate = d.estimatedNextDate;
      existing.monthlyCost = d.monthlyCost;
      existing.priceCreep = d.priceCreep;
      existing.detectedAt = new Date();
      await existing.save();
    } else {
      const s = new Subscription({
        title: d.title,
        merchantSignature: d.merchantSignature,
        category: "Subscription",
        avgAmount: d.avgAmount,
        amountStdDev: d.amountStdDev,
        recurrenceDays: d.recurrenceDays,
        recurrenceStdDev: d.recurrenceStdDev,
        lastPayments: paymentRecords,
        estimatedNextDate: d.estimatedNextDate,
        monthlyCost: d.monthlyCost,
        priceCreep: d.priceCreep,
        user: userId,
        isConfirmed: false,
        active: true,
      });
      await s.save();
    }
  }
}

/* Start scheduled job: runs daily at 02:00 server time */
export function startSubscriptionScanner(cronSpec = "0 2 * * *") {
  if (subscriptionScanJob) return; // already started
  // cronSpec default "0 2 * * *" -> 02:00 daily
  subscriptionScanJob = cron.schedule(cronSpec, async () => {
    console.log("[cron] subscription scan started");
    try {
      // iterate users in batches to avoid memory bloat; simple example processes all users
      const cursor = User.find({}).cursor();
      for (let user = await cursor.next(); user != null; user = await cursor.next()) {
        try {
          await runScanForUser(user._id, 12);
        } catch (err) {
          console.error("Error scanning user", user._id, err);
        }
      }
    } catch (err) {
      console.error("[cron] subscription scan failed", err);
    } finally {
      console.log("[cron] subscription scan finished");
    }
  }, { scheduled: true });

  subscriptionScanJob.start();
  console.log("Subscription scanner scheduled:", cronSpec);
}

/* Stop job */
export function stopSubscriptionScanner() {
  if (!subscriptionScanJob) return;
  subscriptionScanJob.stop();
  subscriptionScanJob.destroy();
  subscriptionScanJob = null;
  console.log("Subscription scanner stopped");
}

/* Manual trigger for all users (careful in prod) */
export async function triggerSubscriptionScanNow() {
  const users = await User.find({});
  for (const u of users) {
    try {
      await runScanForUser(u._id, 12);
    } catch (err) {
      console.error("Manual scan error for user", u._id, err);
    }
  }
}
