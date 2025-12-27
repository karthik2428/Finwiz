// src/services/reportCron.js

import cron from "node-cron";
import User from "../models/User.js";
import { createMonthlyReportPDF } from "./pdfService.js";
import Report from "../models/Report.js";
import { sendBrevoEmail } from "./brevoService.js";
import Transaction from "../models/Transaction.js";
import Goal from "../models/Goal.js";
import Subscription from "../models/Subscription.js";
import moment from "moment";

let job = null;

/**
 * Internal data gatherer (no circular import)
 */
async function gatherReportDataInternal(user, month) {
  const start = moment(month, "YYYY-MM").startOf("month").toDate();
  const end = moment(month, "YYYY-MM").endOf("month").toDate();

  // Summary
  const agg = await Transaction.aggregate([
    { $match: { createdBy: user._id, date: { $gte: start, $lte: end } } },
    { $group: { _id: "$kind", total: { $sum: "$amount" } } }
  ]);

  const summary = { income: 0, expense: 0, savings: 0 };
  agg.forEach((a) => {
    if (a._id === "income") summary.income = a.total;
    if (a._id === "expense") summary.expense = a.total;
  });
  summary.savings = summary.income - summary.expense;

  // Categories
  const categories = await Transaction.aggregate([
    { $match: { createdBy: user._id, kind: "expense", date: { $gte: start, $lte: end } } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } }
  ]);

  // Goals
  const goalsRaw = await Goal.find({ createdBy: user._id }).lean();
  const goals = [];
  for (const g of goalsRaw) {
    const contribAgg = await Transaction.aggregate([
      { $match: { createdBy: user._id, kind: "income", category: g.title } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const currentSaved = contribAgg[0]?.total || 0;
    const monthsLeft = Math.max(
      1,
      Math.round((new Date(g.targetDate) - new Date()) / (1000 * 60 * 60 * 24 * 30))
    );

    goals.push({
      title: g.title,
      targetAmount: g.targetAmount,
      targetDate: g.targetDate,
      currentSaved,
      remaining: Math.max(0, g.targetAmount - currentSaved),
      requiredMonthlySaving: Number(
        ((Math.max(0, g.targetAmount - currentSaved)) / monthsLeft).toFixed(2)
      ),
      riskCategory: g.riskCategory,
    });
  }

  const subscriptions = await Subscription.find({ user: user._id }).lean();

  // Forecast
  const monthsBack = 3;
  const monthlyBuckets = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const m = moment().subtract(i, "months");

    const s = await Transaction.aggregate([
      { $match: { createdBy: user._id, date: { $gte: m.startOf("month").toDate(), $lte: m.endOf("month").toDate() } } },
      { $group: { _id: "$kind", total: { $sum: "$amount" } } }
    ]);

    let income = 0, expense = 0;
    s.forEach((r) => { if (r._id === "income") income = r.total; if (r._id === "expense") expense = r.total; });

    monthlyBuckets.push(income - expense);
  }

  const weights = [1, 2, 3].slice(-monthlyBuckets.length);
  let wmaForecast = 0;
  if (monthlyBuckets.length) {
    let num = 0, den = 0;
    for (let i = 0; i < monthlyBuckets.length; i++) {
      num += monthlyBuckets[i] * weights[i];
      den += weights[i];
    }
    wmaForecast = den ? num / den : 0;
  }

  return {
    summary,
    categories,
    goals,
    subscriptions,
    forecast: { wmaForecast },
  };
}

/**
 * Start monthly report cron
 */
export function startReportCron(cronSpec = "0 2 1 * *") {
  if (job) return;

  job = cron.schedule(cronSpec, async () => {
    console.log("[ReportCron] Generating monthly reports...");

    const month = moment().subtract(1, "month").format("YYYY-MM");
    const users = await User.find({ "premium.isActive": true });

    for (const user of users) {
      try {
        const data = await gatherReportDataInternal(user, month);

        const { buffer, fileName, filePath } =
          await createMonthlyReportPDF(user, month, data);

        await Report.create({ user: user._id, month, fileName, filePath });

        const base64 = buffer.toString("base64");

        await sendBrevoEmail(
          user.email,
          `Your FinWiz Monthly Report — ${month}`,
          "Attached is your monthly financial report.",
          `<p>Attached is your monthly report.</p>`,
          base64,
          fileName
        );

      } catch (err) {
        console.error("[ReportCron] Error:", err.message);
      }
    }

    console.log("[ReportCron] Done.");
  });

  job.start();
}
