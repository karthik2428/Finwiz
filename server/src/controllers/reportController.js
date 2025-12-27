// src/controllers/reportController.js
import asyncHandler from "../middlewares/asyncHandler.js";
import Transaction from "../models/Transaction.js";
import Goal from "../models/Goal.js";
import Subscription from "../models/Subscription.js";
import Report from "../models/Report.js";
import { createMonthlyReportPDF } from "../services/pdfService.js";
import moment from "moment";
import fs from "fs-extra";

/**
 * Normalize month and verify format (YYYY-MM)
 */
function validateMonth(month) {
  if (!month || !moment(month, "YYYY-MM", true).isValid()) {
    return null;
  }
  return month;
}

/**
 * Helper: gather all required report data for a user
 */
async function gatherReportData(user, month) {
  const normalizedMonth = validateMonth(month);
  if (!normalizedMonth) throw new Error("Invalid month format. Use YYYY-MM.");

  const start = moment(normalizedMonth, "YYYY-MM").startOf("month").toDate();
  const end = moment(normalizedMonth, "YYYY-MM").endOf("month").toDate();

  /* -----------------------------
     SUMMARY (Income / Expense)
  ------------------------------*/
  const agg = await Transaction.aggregate([
    { $match: { createdBy: user._id, date: { $gte: start, $lte: end } } },
    { $group: { _id: "$kind", total: { $sum: "$amount" } } }
  ]);

  const summary = { income: 0, expense: 0, savings: 0 };
  for (const a of agg) {
    if (a._id === "income") summary.income = a.total;
    if (a._id === "expense") summary.expense = a.total;
  }
  summary.savings = summary.income - summary.expense;

  /* -----------------------------
     CATEGORY BREAKDOWN
  ------------------------------*/
  const categories = await Transaction.aggregate([
    { $match: { createdBy: user._id, kind: "expense", date: { $gte: start, $lte: end } } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
  ]);

  /* -----------------------------
     GOALS SUMMARY
  ------------------------------*/
  const goalsRaw = await Goal.find({ createdBy: user._id }).lean();
  const goals = [];

  for (const g of goalsRaw) {
    const contribAgg = await Transaction.aggregate([
      { $match: { createdBy: user._id, kind: "income", category: g.title } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const currentSaved = contribAgg[0]?.total || 0;
    const remaining = Math.max(0, g.targetAmount - currentSaved);

    const monthsLeft = Math.max(
      1,
      Math.round((new Date(g.targetDate) - new Date()) / (1000 * 60 * 60 * 24 * 30))
    );

    goals.push({
      title: g.title,
      targetAmount: g.targetAmount,
      targetDate: g.targetDate,
      currentSaved,
      remaining,
      requiredMonthlySaving: Number((remaining / monthsLeft).toFixed(2)),
      riskCategory: g.riskCategory
    });
  }

  /* -----------------------------
     SUBSCRIPTIONS
  ------------------------------*/
  const subscriptions = await Subscription.find({
    user: user._id,
    active: true,
  }).lean();

  /* -----------------------------
     FORECAST (3-month WMA)
  ------------------------------*/
  const monthsBack = 3;
  const monthlyBuckets = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const m = moment().subtract(i, "months");
    const s = await Transaction.aggregate([
      {
        $match: {
          createdBy: user._id,
          date: { $gte: m.startOf("month").toDate(), $lte: m.endOf("month").toDate() }
        }
      },
      { $group: { _id: "$kind", total: { $sum: "$amount" } } }
    ]);

    let income = 0, expense = 0;
    s.forEach(r => {
      if (r._id === "income") income = r.total;
      if (r._id === "expense") expense = r.total;
    });

    monthlyBuckets.push(income - expense);
  }

  let wmaForecast = 0;
  try {
    const weights = [1, 2, 3];
    const aligned = weights.slice(-monthlyBuckets.length);
    let num = 0, den = 0;

    for (let i = 0; i < monthlyBuckets.length; i++) {
      num += monthlyBuckets[i] * aligned[i];
      den += aligned[i];
    }
    wmaForecast = den ? num / den : 0;
  } catch (_) {}

  return {
    summary,
    categories,
    goals,
    subscriptions,
    forecast: { wmaForecast }
  };
}

/**
 * GET /report/monthly?month=YYYY-MM
 */
export const downloadMonthlyReport = asyncHandler(async (req, res) => {
  const month = validateMonth(req.query.month) || moment().format("YYYY-MM");
  const user = req.user;

  const data = await gatherReportData(user, month);

  const { buffer, fileName, filePath } = await createMonthlyReportPDF(
    user,
    month,
    data
  );

  await Report.create({
    user: user._id,
    month,
    filePath,
    fileName
  });

  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader("Content-Type", "application/pdf");
  res.send(buffer);
});

/**
 * POST /report/send-email?month=YYYY-MM
 */
export const sendMonthlyReportEmail = asyncHandler(async (req, res) => {
  const month = validateMonth(req.query.month) || moment().format("YYYY-MM");
  const user = req.user;

  const data = await gatherReportData(user, month);
  const { buffer, fileName, filePath } = await createMonthlyReportPDF(
    user,
    month,
    data
  );

  await Report.create({
    user: user._id,
    month,
    filePath,
    fileName
  });

  // Email attachment
  const base64Content = buffer.toString("base64");

  const payload = {
    sender: { email: "shop24963@gmail.com", name: "FinWiz Reports" },
    to: [{ email: user.email }],
    subject: `FinWiz Monthly Report — ${month}`,
    htmlContent: `<p>Hi ${user.name},</p>
      <p>Your FinWiz monthly financial report for <strong>${month}</strong> is attached.</p>
      <p>Best regards,<br/>FinWiz Team</p>`,
    attachment: [
      {
        name: fileName,
        content: base64Content
      }
    ]
  };

  try {
    const axios = (await import("axios")).default;
    await axios.post("https://api.brevo.com/v3/smtp/email", payload, {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json"
      },
      timeout: 15000
    });
  } catch (err) {
    console.error("Email sending failed:", err.response?.data || err.message);
    return res.status(200).json({
      message: "Report generated but email sending failed.",
      fileName
    });
  }

  res.json({ message: "Report generated and emailed", fileName });
});
