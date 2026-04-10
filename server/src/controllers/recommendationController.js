import asyncHandler from "../middlewares/asyncHandler.js";
import { estimateSIP } from "../utils/mfMath.js";
import Goal from "../models/Goal.js";
import FundMetadata from "../models/FundMetadata.js";

/* ===================================================== */
/* DURATION-BASED PORTFOLIO STRUCTURES                   */
/* ===================================================== */

function buildPortfolioTemplate(durationMonths) {

  if (durationMonths <= 24) {
    return {
      name: "Capital Protection Portfolio",
      expectedReturn: 7,
      buckets: [
        { types: ["liquid"], weight: 40 },
        { types: ["corporate_bond"], weight: 40 },
        { types: ["short_term"], weight: 20 }
      ]
    };
  }

  if (durationMonths <= 60) {
    return {
      name: "Balanced Growth Portfolio",
      expectedReturn: 12,
      buckets: [
        { types: ["large_cap", "bluechip"], weight: 35 },
        { types: ["hybrid"], weight: 25 },
        { types: ["mid_cap"], weight: 25 },
        { types: ["index"], weight: 15 }
      ]
    };
  }

  return {
    name: "Growth Accelerator Portfolio",
    expectedReturn: 15,
    buckets: [
      { types: ["flexi_cap", "multi_cap"], weight: 30 },
      { types: ["mid_cap"], weight: 30 },
      { types: ["small_cap"], weight: 25 },
      { types: ["large_cap"], weight: 15 }
    ]
  };
}

/* ===================================================== */
/* CONTROLLER                                             */
/* ===================================================== */

export const recommendFunds = asyncHandler(async (req, res) => {

  const { goalId } = req.query;

  if (!goalId)
    return res.status(400).json({ message: "goalId required" });

  const goal = await Goal.findOne({
    _id: goalId,
    createdBy: req.user._id
  });

  if (!goal)
    return res.status(404).json({ message: "Goal not found" });

  const durationMonths = Math.max(
    1,
    Math.ceil(
      (new Date(goal.targetDate) - new Date()) /
      (30 * 24 * 60 * 60 * 1000)
    )
  );

  const template = buildPortfolioTemplate(durationMonths);

  /* ---------------- Fetch All Approved Funds ---------------- */

  const funds = await FundMetadata.find({ approved: true })
    .select(
      "schemeName schemeCode categoryOverride cagr1y cagr3y cagr5y volatility1y"
    )
    .limit(500);

  if (!funds.length)
    return res.json({ message: "No funds available" });

  /* ---------------- Sort Funds By Long-Term Strength ---------------- */

  const sortedFunds = funds.sort((a, b) => {
    return (b.cagr5y || 0) - (a.cagr5y || 0);
  });

  /* ---------------- Build Portfolio ---------------- */

  const portfolioFunds = [];
  const used = new Set();

  for (const bucket of template.buckets) {

    const candidates = sortedFunds.filter(
      f =>
        bucket.types.includes(f.categoryOverride) &&
        !used.has(f.schemeCode)
    );

    if (!candidates.length) continue;

    const best = candidates[0];
    used.add(best.schemeCode);

    const selectedCagr =
      durationMonths <= 24
        ? best.cagr1y
        : durationMonths <= 60
        ? best.cagr3y
        : best.cagr5y;

    portfolioFunds.push({
      fundName: best.schemeName,
      schemeCode: best.schemeCode,
      cagr: Number(selectedCagr?.toFixed(2)),
      allocationPercent: bucket.weight
    });
  }

  /* ---------------- SIP Calculation ---------------- */

  const totalSip = estimateSIP(
    goal.targetAmount,
    template.expectedReturn,
    durationMonths
  );

  const fundsWithSip = portfolioFunds.map(f => ({
    ...f,
    monthlySip: Math.round(
      (totalSip * f.allocationPercent) / 100
    )
  }));

  res.json({
    goal: {
      title: goal.title,
      targetAmount: goal.targetAmount,
      durationMonths,
      riskCategory: goal.riskCategory
    },
    portfolio: {
      name: template.name,
      expectedReturn: template.expectedReturn,
      totalMonthlySip: totalSip,
      funds: fundsWithSip
    }
  });
});