// src/controllers/analyticsController.js
import asyncHandler from "../middlewares/asyncHandler.js";
import Transaction from "../models/Transaction.js";
import moment from "moment";
import {
  computeSavingsEfficiency,
  projectCategoryExpense,
  compareForecastToActual
} from "../utils/analyticsMath.js";

/**
 * FREE ANALYTICS
 */
export const getBasicAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const last12 = moment().subtract(12, "months").toDate();

  // Aggregate monthly income & expense totals
  const monthly = await Transaction.aggregate([
    { $match: { createdBy: userId, date: { $gte: last12 } } },
    {
      $group: {
        _id: { month: { $month: "$date" }, year: { $year: "$date" }, kind: "$kind" },
        total: { $sum: "$amount" }
      }
    }
  ]);

  const incomeMap = {};
  const expenseMap = {};

  monthly.forEach(m => {
    const key = `${m._id.year}-${m._id.month}`;
    if (m._id.kind === "income") incomeMap[key] = m.total;
    if (m._id.kind === "expense") expenseMap[key] = m.total;
  });

  // Category breakdown (last 30 days)
  const last30 = moment().subtract(30, "days").toDate();
  const categoryBreakdown = await Transaction.aggregate([
    { $match: { createdBy: userId, kind: "expense", date: { $gte: last30 } } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } }
  ]);

  // Summary totals
  const totalIncome = Object.values(incomeMap).reduce((a, b) => a + b, 0);
  const totalExpense = Object.values(expenseMap).reduce((a, b) => a + b, 0);
  const totalSavings = totalIncome - totalExpense;

  res.json({
    monthlyIncome: incomeMap,
    monthlyExpense: expenseMap,
    categoryBreakdown,
    totalIncome,
    totalExpense,
    totalSavings,
  });
});


/**
 * PREMIUM ANALYTICS
 */
export const getPremiumAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role !== "premium") {
    return res.status(403).json({ message: "Premium access required" });
  }

  const userId = req.user._id;
  const last12 = moment().subtract(12, "months").toDate();

  // Monthly summary
  const monthly = await Transaction.aggregate([
    { $match: { createdBy: userId, date: { $gte: last12 } } },
    {
      $group: {
        _id: { month: { $month: "$date" }, year: { $year: "$date" }, kind: "$kind" },
        total: { $sum: "$amount" }
      }
    }
  ]);

  // Process monthly income/expenses
  const incomeByMonth = {};
  const expenseByMonth = {};

  monthly.forEach(m => {
    const key = `${m._id.year}-${m._id.month}`;
    if (m._id.kind === "income") incomeByMonth[key] = m.total;
    if (m._id.kind === "expense") expenseByMonth[key] = m.total;
  });

  // Calculate active months
  const uniqueMonths = Object.keys(incomeByMonth).length > 0
    ? Object.keys(incomeByMonth)
    : Object.keys(expenseByMonth);

  // Merge keys to get true unique count
  const allMonths = new Set([...Object.keys(incomeByMonth), ...Object.keys(expenseByMonth)]);
  const monthsActive = Math.max(1, allMonths.size);

  const avgIncome = Number((Object.values(incomeByMonth).reduce((a, b) => a + b, 0) / monthsActive).toFixed(2));
  const avgExpense = Number((Object.values(expenseByMonth).reduce((a, b) => a + b, 0) / monthsActive).toFixed(2));
  const avgSavings = Number((avgIncome - avgExpense).toFixed(2));

  const efficiencyScore = computeSavingsEfficiency(avgIncome, avgExpense, avgSavings);

  // Category projections (premium)
  const categoryHistory = await Transaction.aggregate([
    { $match: { createdBy: userId, kind: "expense", date: { $gte: last12 } } },
    {
      $group: {
        _id: { category: "$category", month: { $month: "$date" }, year: { $year: "$date" } },
        total: { $sum: "$amount" }
      }
    }
  ]);

  // Create projections
  const projections = {};
  const categoryMap = {};

  categoryHistory.forEach(entry => {
    const key = entry._id.category;
    if (!categoryMap[key]) categoryMap[key] = [];
    categoryMap[key].push(entry.total);
  });

  Object.entries(categoryMap).forEach(([cat, history]) => {
    projections[cat] = projectCategoryExpense(history);
  });

  // Forecast vs Actual: Compare SAVINGS forecast to actual SAVINGS
  // Get the last month's actual savings (income - expense)
  const monthKeys = Array.from(allMonths).sort();
  const lastMonthKey = monthKeys[monthKeys.length - 1];

  const lastMonthIncome = incomeByMonth[lastMonthKey] || 0;
  const lastMonthExpense = expenseByMonth[lastMonthKey] || 0;
  const lastMonthSavings = lastMonthIncome - lastMonthExpense;

  // Use average savings as the "forecast" baseline
  const forecastSavings = avgSavings;
  const forecastDiff = compareForecastToActual(forecastSavings, lastMonthSavings);

  res.json({
    avgIncome,
    avgExpense,
    avgSavings,
    efficiencyScore,
    projections,
    forecastComparison: {
      forecast: forecastSavings,
      actual: lastMonthSavings,
      differencePct: forecastDiff
    }
  });
});
