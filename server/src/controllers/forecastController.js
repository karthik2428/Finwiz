// src/controllers/forecastController.js
import asyncHandler from "../middlewares/asyncHandler.js";
import Transaction from "../models/Transaction.js";
import moment from "moment";
import { computeWMA, prepareMonthlySavings } from "../utils/forecastMath.js";

/**
 * GET /forecast/savings
 * Query params (optional):
 *  - monthsBack (default 6) -> how many months to consider for series
 *  - weights (comma separated, e.g. weights=3,2,1) -> weights for WMA (must match last N months)
 *
 * Returns:
 *  {
 *    series: [oldest,...,newest],
 *    wmaForecast,
 *    trend: { direction: "up"/"down"/"stable", pctChange }
 *  }
 */
export const forecastSavings = asyncHandler(async (req, res) => {
  const monthsBack = Math.max(3, Number(req.query.monthsBack || 6)); // min 3
  const weightsQuery = req.query.weights; // optional, e.g. "3,2,1"
  let weights = null;
  if (weightsQuery) {
    weights = weightsQuery.split(",").map(s => Number(s.trim())).filter(n => !Number.isNaN(n) && n >= 0);
  } else {
    // default weights: descending for monthsBack: e.g., monthsBack=6 -> [6,5,4,3,2,1]
    weights = [];
    for (let i = monthsBack; i >= 1; i--) weights.push(i);
    weights.reverse(); // align oldest->newest
  }

  // fetch user's transactions for monthsBack months
  const since = moment().subtract(monthsBack - 1, "months").startOf("month").toDate();
  const txs = await Transaction.find({
    createdBy: req.user._id,
    date: { $gte: since }
  }).select("date kind amount").lean();

  const series = prepareMonthlySavings(txs, monthsBack); // oldest->newest

  // ensure weights length >= series length; align weights to series length by taking last n weights
  const alignedWeights = weights.slice(-series.length);

  const wma = computeWMA(series, alignedWeights);

  // compute trend: compare forecast to average of last N months
  const lastN = series.slice(-alignedWeights.length);
  const avgLast = lastN.reduce((s, v) => s + v, 0) / Math.max(1, lastN.length);

  let pctChange = 0;
  if (avgLast === 0) pctChange = wma === 0 ? 0 : 100;
  else pctChange = ((wma - avgLast) / Math.abs(avgLast)) * 100;

  const direction = Math.abs(pctChange) < 2 ? "stable" : (pctChange > 0 ? "up" : "down");

  // --- Phase 2: Enhanced Math & Scenarios ---
  const inflationRate = 0.06; // 6% annual inflation
  const monthlyInflation = inflationRate / 12;

  // Base WMA is our "likely" case
  const baseForecast = Number(wma.toFixed(2));

  // Scenarios:
  // Optimistic: +10% improvement in savings rate (simulating cut costs/income bump)
  const optimistic = Number((baseForecast * 1.10).toFixed(2));

  // Pessimistic: -10% decline (simulating unexpected expenses)
  const pessimistic = Number((baseForecast * 0.90).toFixed(2));

  // Inflation Adjusted (Real Value of Base Forecast)
  // PV = FV / (1 + r)^n, where n=1 month ahead
  const inflationAdjusted = Number((baseForecast / (1 + monthlyInflation)).toFixed(2));

  res.json({
    monthsBack,
    series, // oldest->newest
    weights: alignedWeights,
    wmaForecast: baseForecast, // kept for backward compatibility
    forecastScenarios: {
      base: baseForecast,
      optimistic,
      pessimistic,
      inflationAdjusted,
      inflationRateAnnual: "6%"
    },
    trend: {
      direction,
      pctChange: Number(pctChange.toFixed(2)),
      avgLast: Number(avgLast.toFixed(2))
    },
    // New: Educational tip for frontend
    insight: `Adjusted for 6% inflation, your predicted ₹${baseForecast} is effectively worth ₹${inflationAdjusted} in today's buying power.`
  });
});

/**
 * GET /forecast/compare
 * Premium-only endpoint comparing WMA forecast vs actual next-month (if available)
 * Query:
 *  - monthsBack (same as above)
 * This endpoint will:
 *  - compute forecast using last N months
 *  - if there are transactions for the month immediately following the last month in series (i.e., "actual" month),
 *    compute actualSavings for that month and report difference
 */
export const compareForecast = asyncHandler(async (req, res) => {
  if (req.user.role !== "premium") return res.status(403).json({ message: "Premium access required" });

  const monthsBack = Math.max(3, Number(req.query.monthsBack || 6));
  const weightsQuery = req.query.weights;
  let weights = null;
  if (weightsQuery) {
    weights = weightsQuery.split(",").map(s => Number(s.trim())).filter(n => !Number.isNaN(n) && n >= 0);
  } else {
    weights = [];
    for (let i = monthsBack; i >= 1; i--) weights.push(i);
    weights.reverse();
  }

  const since = moment().subtract(monthsBack - 1, "months").startOf("month").toDate();
  const txs = await Transaction.find({
    createdBy: req.user._id,
    date: { $gte: since }
  }).select("date kind amount").lean();

  const series = prepareMonthlySavings(txs, monthsBack); // oldest->newest
  const alignedWeights = weights.slice(-series.length);
  const wma = computeWMA(series, alignedWeights);

  // determine actual next month (month after newest)
  const newestMonth = moment().subtract(0, "months").format("YYYY-MM"); // newest = current month in prepareMonthlySavings
  // next month is current month + 1
  const nextMonthMoment = moment().add(1, "month");
  const nextMonthKeyStart = nextMonthMoment.startOf("month").toDate();
  const nextMonthKeyEnd = nextMonthMoment.endOf("month").toDate();

  // fetch transactions in next month (if any)
  const actualTxs = await Transaction.find({
    createdBy: req.user._id,
    date: { $gte: nextMonthKeyStart, $lte: nextMonthKeyEnd }
  }).select("date kind amount").lean();

  const actualSeries = prepareMonthlySavings(actualTxs, 1); // single month
  const actualSavings = actualSeries[0] || 0;

  // Bounded percentage calculation using symmetric approach
  // This prevents explosion when WMA is very small
  let diffPct = 0;

  if (wma === 0 && actualSavings === 0) {
    diffPct = 0;
  } else if (wma === 0) {
    // If forecast is 0 but actual is not, return capped value
    diffPct = actualSavings > 0 ? 100 : -100;
  } else {
    // Use symmetric denominator for stability
    const avgMagnitude = (Math.abs(wma) + Math.abs(actualSavings)) / 2;
    if (avgMagnitude > 0) {
      diffPct = ((actualSavings - wma) / avgMagnitude) * 100;
      // Cap at ±100%
      diffPct = Math.max(-100, Math.min(100, diffPct));
    }
  }

  const diff = Number(diffPct.toFixed(2));

  res.json({
    monthsBack,
    series,
    weights: alignedWeights,
    wmaForecast: Number(wma.toFixed(2)),
    actualSavings,
    differencePct: diff,
    verdict: Math.abs(diff) < 5 ? "on_track" : (diff > 0 ? "better_than_forecast" : "worse_than_forecast")
  });
});
