import asyncHandler from "../middlewares/asyncHandler.js";
import { fetchFundList, fetchFundHistory } from "../services/mfService.js";
import { computeCAGR, estimateSIP } from "../utils/mfMath.js";
import Goal from "../models/Goal.js";

/* -------------------------------------------------- */
/* FUND CLASSIFICATION (RELAXED & REALISTIC)          */
/* -------------------------------------------------- */
function classifyFund(name) {
  const n = name.toLowerCase();

  if (n.includes("liquid")) return "liquid";
  if (n.includes("ultra short")) return "ultra_short";
  if (n.includes("short term")) return "short_term";
  if (n.includes("corporate")) return "corporate_bond";

  if (n.includes("index") || n.includes("nifty") || n.includes("sensex"))
    return "index";

  if (n.includes("bluechip")) return "bluechip";

  if (n.includes("large") && n.includes("mid")) return "mid_cap";
  if (n.includes("large")) return "large_cap";

  if (n.includes("flexi")) return "flexi_cap";
  if (n.includes("multi")) return "multi_cap";

  if (n.includes("mid")) return "mid_cap";
  if (n.includes("small")) return "small_cap";

  if (n.includes("balanced") || n.includes("hybrid")) return "hybrid";

  return "other";
}

/* -------------------------------------------------- */
/* PORTFOLIO TEMPLATES                                */
/* -------------------------------------------------- */
const PORTFOLIO_TEMPLATES = {
  CONSERVATIVE_SHORT: {
    name: "Capital Protection Portfolio",
    expectedReturn: 7,
    buckets: [
      { type: "liquid", weight: 40 },
      { type: "corporate_bond", weight: 40 },
      { type: "short_term", weight: 20 }
    ]
  },

  MODERATE_MEDIUM: {
    name: "Balanced Growth Portfolio",
    expectedReturn: 12,
    buckets: [
      { type: "large_cap", weight: 35 },
      { type: "hybrid", weight: 25 },
      { type: "mid_cap", weight: 25 },
      { type: "index", weight: 15 }
    ]
  },

  AGGRESSIVE_LONG: {
    name: "Growth Accelerator Portfolio",
    expectedReturn: 15,
    buckets: [
      { type: "large_cap", weight: 30 },
      { type: "flexi_cap", weight: 30 },
      { type: "mid_cap", weight: 25 },
      { type: "small_cap", weight: 15 }
    ]
  }
};

/* -------------------------------------------------- */
/* PORTFOLIO SELECTION                                */
/* -------------------------------------------------- */
function selectPortfolio(risk, months) {
  if (months <= 24) return PORTFOLIO_TEMPLATES.CONSERVATIVE_SHORT;
  if (risk === "low") return PORTFOLIO_TEMPLATES.CONSERVATIVE_SHORT;
  if (risk === "medium") return PORTFOLIO_TEMPLATES.MODERATE_MEDIUM;
  return PORTFOLIO_TEMPLATES.AGGRESSIVE_LONG;
}

/* -------------------------------------------------- */
/* CONTROLLER                                        */
/* -------------------------------------------------- */
export const recommendFunds = asyncHandler(async (req, res) => {
  const { goalId } = req.query;
  if (!goalId) return res.status(400).json({ message: "goalId required" });

  const goal = await Goal.findOne({ _id: goalId, createdBy: req.user._id });
  if (!goal) return res.status(404).json({ message: "Goal not found" });

  /* ✅ Normalize risk */
  const riskMap = {
    conservative: "low",
    moderate: "medium",
    aggressive: "high"
  };
  const userRisk = riskMap[goal.riskCategory] || "medium";

  /* ✅ Derive duration */
  const durationMonths = Math.max(
    1,
    Math.ceil((new Date(goal.targetDate) - new Date()) / (30 * 24 * 60 * 60 * 1000))
  );

  /* -------------------------------------------------- */
  /* FETCH & SCORE FUNDS                                */
  /* -------------------------------------------------- */
  const funds = await fetchFundList();
  const scored = [];

  for (const fund of funds.slice(0, 80)) { // ✅ scan more funds
    try {
      const history = await fetchFundHistory(fund.schemeCode);
      const navs = history.data;

      if (!navs || navs.length < 360) continue;

      const newest = Number(navs[0].nav);
      const oldest = Number(navs[navs.length - 360].nav);
      if (!oldest || !newest || oldest <= 0) continue;

      let cagr = computeCAGR(oldest, newest, 1) * 100;
      cagr = Math.min(Math.max(cagr, 4), 18);

      const last90 = navs.slice(0, 90).map(n => Number(n.nav));
      const avg = last90.reduce((a, b) => a + b, 0) / last90.length;
      const volatility = Math.sqrt(
        last90.reduce((s, n) => s + Math.pow(n - avg, 2), 0) / last90.length
      );

      scored.push({
        fundName: fund.schemeName,
        schemeCode: fund.schemeCode,
        type: classifyFund(fund.schemeName),
        cagr: Number(cagr.toFixed(2)),
        volatility: Number(volatility.toFixed(2))
      });
    } catch {}
  }

  if (!scored.length) {
    return res.json({ message: "Unable to score funds at this time" });
  }

  /* -------------------------------------------------- */
  /* BUILD PORTFOLIO (✅ FIXED)                          */
  /* -------------------------------------------------- */
  const template = selectPortfolio(userRisk, durationMonths);
  const portfolioFunds = [];

  for (const bucket of template.buckets) {
    let candidates = scored.filter(f => f.type === bucket.type);

    // ✅ relaxed matching
    if (bucket.type === "large_cap") {
      candidates = candidates.concat(scored.filter(f => f.type === "bluechip"));
    }

    if (bucket.type === "flexi_cap") {
      candidates = candidates.concat(scored.filter(f => f.type === "multi_cap"));
    }

    // ✅ fallback: best overall fund
    const best =
      candidates.sort((a, b) => b.cagr - a.cagr || a.volatility - b.volatility)[0]
      || scored.sort((a, b) => b.cagr - a.cagr)[0];

    if (!best) continue;

    portfolioFunds.push({
      ...best,
      allocationPercent: bucket.weight
    });
  }

  /* -------------------------------------------------- */
  /* SIP CALCULATION                                    */
  /* -------------------------------------------------- */
  const totalSip = estimateSIP(
    goal.targetAmount,
    template.expectedReturn,
    durationMonths
  );

  const fundsWithSip = portfolioFunds.map(f => ({
    ...f,
    monthlySip: Math.round(totalSip * f.allocationPercent / 100)
  }));

  /* -------------------------------------------------- */
  /* RESPONSE                                           */
  /* -------------------------------------------------- */
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
