// src/services/cronService.js

import cron from "node-cron";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Subscription from "../models/Subscription.js";
import FundMetadata from "../models/FundMetadata.js";
import { detectSubscriptionsFromTransactions } from "../utils/subscriptionDetector.js";
import { fetchFundHistory } from "./mfService.js";
import {
  computeCAGR,
  calculateVolatility,
  calculateSharpeRatio
} from "../utils/mfMath.js";

/* ================= JOB HANDLES ================= */

let subscriptionScanJob = null;
let fundScoreJob = null;

/* ========================================================= */
/* ================= SUBSCRIPTION CRON ===================== */
/* ========================================================= */

async function runScanForUser(userId, lookbackMonths = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - lookbackMonths);

  const txs = await Transaction.find({
    createdBy: userId,
    kind: "expense",
    date: { $gte: since }
  }).sort({ date: 1 });

  const detected = detectSubscriptionsFromTransactions(txs, {
    nameSimilarityThreshold: 0.8,
    minPayments: 3,
    recurrenceToleranceDays: 5,
    amountVariationPct: 0.25,
    priceCreepWindow: 4,
    priceCreepPct: 0.08
  });

  for (const d of detected) {
    const existing = await Subscription.findOne({
      user: userId,
      merchantSignature: d.merchantSignature
    });

    const paymentRecords = d.payments.map(p => ({
      date: p.date,
      amount: p.amount,
      txId: p.txId
    }));

    if (existing) {
      Object.assign(existing, {
        title: d.title,
        avgAmount: d.avgAmount,
        amountStdDev: d.amountStdDev,
        recurrenceDays: d.recurrenceDays,
        recurrenceStdDev: d.recurrenceStdDev,
        lastPayments: paymentRecords,
        estimatedNextDate: d.estimatedNextDate,
        monthlyCost: d.monthlyCost,
        priceCreep: d.priceCreep,
        detectedAt: new Date()
      });

      await existing.save();
    } else {
      await Subscription.create({
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
        active: true
      });
    }
  }
}

export function startSubscriptionScanner(cronSpec = "0 2 * * *") {
  if (subscriptionScanJob) return;

  subscriptionScanJob = cron.schedule(cronSpec, async () => {
    console.log("[cron] subscription scan started");

    try {
      const cursor = User.find({}).cursor();

      for (
        let user = await cursor.next();
        user != null;
        user = await cursor.next()
      ) {
        try {
          await runScanForUser(user._id, 12);
        } catch (err) {
          console.error("User scan error:", err.message);
        }
      }

    } catch (err) {
      console.error("Subscription cron failed:", err.message);
    }

    console.log("[cron] subscription scan finished");
  });

  subscriptionScanJob.start();
}

/* ========================================================= */
/* ================= FUND SCORING CRON ===================== */
/* ========================================================= */

export function startFundScoringCron(cronSpec = "* * * * *") {
  if (fundScoreJob) return;

  fundScoreJob = cron.schedule(cronSpec, async () => {
    console.log("[cron] fund scoring started");

    try {
      const funds = await FundMetadata.find({ approved: true });

      for (const fund of funds) {
        try {
          const history = await fetchFundHistory(fund.schemeCode);

          if (!history || !history.data || !Array.isArray(history.data)) {
            console.log("Invalid NAV response:", fund.schemeCode);
            continue;
          }

          const navs = history.data;

          if (navs.length < 365) {
            console.log("Not enough NAV data:", fund.schemeCode);
            continue;
          }

          // MFAPI returns latest first
          const newest = Number(navs[0].nav);

          const getNav = (daysAgo) => {
            if (navs.length > daysAgo) {
              const value = Number(navs[daysAgo].nav);
              return isNaN(value) ? null : value;
            }
            return null;
          };

          const old1y = getNav(365);
          const old3y = getNav(365 * 3);
          const old5y = getNav(365 * 5);

          fund.cagr1y = old1y
            ? computeCAGR(old1y, newest, 1) * 100
            : 0;

          fund.cagr3y = old3y
            ? computeCAGR(old3y, newest, 3) * 100
            : fund.cagr1y;

          fund.cagr5y = old5y
            ? computeCAGR(old5y, newest, 5) * 100
            : fund.cagr3y;

          fund.volatility1y = calculateVolatility(
            navs.slice(0, 365)
          );

          fund.sharpeRatio = calculateSharpeRatio(
            fund.cagr3y,
            fund.volatility1y
          );

          fund.smartScore = fund.sharpeRatio;

          fund.lastNavComputed = new Date();

          await fund.save();

          console.log(
            `Updated ${fund.schemeName} → 1Y CAGR: ${fund.cagr1y.toFixed(2)}%`
          );

        } catch (err) {
          console.error(
            "Fund scoring error:",
            fund.schemeCode,
            err.message
          );
        }
      }

      console.log("[cron] fund scoring completed");

    } catch (err) {
      console.error("Fund scoring cron failed:", err.message);
    }

  });

  fundScoreJob.start();
}