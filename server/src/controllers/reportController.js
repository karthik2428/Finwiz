// src/controllers/reportController.js

import asyncHandler from "../middlewares/asyncHandler.js";
import Transaction from "../models/Transaction.js";
import Goal from "../models/Goal.js";
import Subscription from "../models/Subscription.js";
import Report from "../models/Report.js";
import { createMonthlyReportPDF } from "../services/pdfService.js";
import { sendBrevoEmail } from "../services/brevoService.js";
import moment from "moment";

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

  /* =====================================================
     1️⃣ OPENING BALANCE (ALL TRANSACTIONS BEFORE MONTH)
  ====================================================== */

  const previousAgg = await Transaction.aggregate([
    {
      $match: {
        createdBy: user._id,
        date: { $lt: start }
      }
    },
    { $group: { _id: "$kind", total: { $sum: "$amount" } } }
  ]);

  let prevIncome = 0;
  let prevExpense = 0;

  previousAgg.forEach(a => {
    if (a._id === "income") prevIncome = a.total;
    if (a._id === "expense") prevExpense = a.total;
  });

  const openingBalance = prevIncome - prevExpense;

  /* =====================================================
     2️⃣ CURRENT MONTH SUMMARY
  ====================================================== */

  const agg = await Transaction.aggregate([
    {
      $match: {
        createdBy: user._id,
        date: { $gte: start, $lte: end }
      }
    },
    { $group: { _id: "$kind", total: { $sum: "$amount" } } }
  ]);

  let income = 0;
  let expense = 0;

  agg.forEach(a => {
    if (a._id === "income") income = a.total;
    if (a._id === "expense") expense = a.total;
  });

  const periodNet = income - expense;
  const closingBalance = openingBalance + periodNet;

  const summary = {
    openingBalance,
    income,
    expense,
    periodNet,
    closingBalance
  };

  /* =====================================================
     CATEGORY BREAKDOWN
  ====================================================== */

  const categories = await Transaction.aggregate([
    {
      $match: {
        createdBy: user._id,
        kind: "expense",
        date: { $gte: start, $lte: end }
      }
    },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } }
  ]);

  /* =====================================================
     GOALS
  ====================================================== */

  const goalsRaw = await Goal.find({ createdBy: user._id }).lean();
  const goals = [];

  for (const g of goalsRaw) {
    const contribAgg = await Transaction.aggregate([
      {
        $match: {
          createdBy: user._id,
          kind: "income",
          category: g.title
        }
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const currentSaved = contribAgg[0]?.total || 0;
    const remaining = Math.max(0, g.targetAmount - currentSaved);

    const monthsLeft = Math.max(
      1,
      Math.round(
        (new Date(g.targetDate) - new Date()) /
          (1000 * 60 * 60 * 24 * 30)
      )
    );

    goals.push({
      title: g.title,
      targetAmount: g.targetAmount,
      targetDate: g.targetDate,
      currentSaved,
      remaining,
      requiredMonthlySaving: Number(
        (remaining / monthsLeft).toFixed(2)
      ),
      riskCategory: g.riskCategory
    });
  }

  /* =====================================================
     SUBSCRIPTIONS
  ====================================================== */

  const subscriptions = await Subscription.find({
    user: user._id,
    active: true
  }).lean();

  /* =====================================================
     FORECAST (3-MONTH WMA)
  ====================================================== */

  const monthsBack = 3;
  const monthlyBuckets = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const m = moment().subtract(i, "months");

    const s = await Transaction.aggregate([
      {
        $match: {
          createdBy: user._id,
          date: {
            $gte: m.startOf("month").toDate(),
            $lte: m.endOf("month").toDate()
          }
        }
      },
      { $group: { _id: "$kind", total: { $sum: "$amount" } } }
    ]);

    let mIncome = 0;
    let mExpense = 0;

    s.forEach(r => {
      if (r._id === "income") mIncome = r.total;
      if (r._id === "expense") mExpense = r.total;
    });

    monthlyBuckets.push(mIncome - mExpense);
  }

  const weights = [1, 2, 3];
  let num = 0;
  let den = 0;

  monthlyBuckets.forEach((value, index) => {
    num += value * weights[index];
    den += weights[index];
  });

  const wmaForecast = den ? num / den : 0;

  return {
    summary,
    categories,
    goals,
    subscriptions,
    forecast: { wmaForecast }
  };
}

/* =====================================================
   DOWNLOAD REPORT
===================================================== */

export const downloadMonthlyReport = asyncHandler(async (req, res) => {
  const month =
    validateMonth(req.query.month) ||
    moment().format("YYYY-MM");

  const user = req.user;

  const data = await gatherReportData(user, month);

  const { buffer, fileName, filePath } =
    await createMonthlyReportPDF(user, month, data);

  await Report.create({
    user: user._id,
    month,
    filePath,
    fileName
  });

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileName}"`
  );
  res.setHeader("Content-Type", "application/pdf");
  res.send(buffer);
});

/* =====================================================
   EMAIL REPORT
===================================================== */

export const sendMonthlyReportEmail = asyncHandler(async (req, res) => {
  const month =
    validateMonth(req.query.month) ||
    moment().format("YYYY-MM");

  const user = req.user;

  const data = await gatherReportData(user, month);

  const { buffer, fileName, filePath } =
    await createMonthlyReportPDF(user, month, data);

  const base64Content = buffer.toString("base64");

  try {
    await sendBrevoEmail({
      to: user.email,
      subject: `FinWiz Monthly Report — ${month}`,
      text: `Hi ${user.name}, your FinWiz monthly report for ${month} is attached.`,
      html: `
        <p>Hi ${user.name},</p>
        <p>Your FinWiz monthly financial report for <strong>${month}</strong> is attached.</p>
        <p>Best regards,<br/>FinWiz Team</p>
      `,
      attachments: [
        {
          name: fileName,
          content: base64Content,
          contentType: "application/pdf"
        }
      ]
    });

    await Report.create({
      user: user._id,
      month,
      filePath,
      fileName
    });

    return res.json({
      success: true,
      message: "Report generated and emailed successfully",
      fileName
    });

  } catch (error) {
    console.error("Email sending failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Report generated but email sending failed.",
      error: error.message
    });
  }
});