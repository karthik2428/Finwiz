/**
 * ================================
 * CAGR Formula
 * CAGR = (Ending / Beginning)^(1/years) - 1
 * ================================
 */
export function computeCAGR(oldNav, newNav, years) {
  if (!oldNav || !newNav || oldNav <= 0 || newNav <= 0 || years <= 0) {
    return 0;
  }

  return Math.pow(newNav / oldNav, 1 / years) - 1;
}

/**
 * ================================
 * Annualized Volatility
 * Based on daily returns
 * ================================
 */
export function calculateVolatility(navData) {
  if (!navData || navData.length < 2) return 0;

  const returns = [];

  for (let i = 1; i < navData.length; i++) {
    const today = Number(navData[i - 1].nav);
    const yesterday = Number(navData[i].nav);

    if (today > 0 && yesterday > 0) {
      returns.push((today - yesterday) / yesterday);
    }
  }

  if (!returns.length) return 0;

  const mean =
    returns.reduce((sum, r) => sum + r, 0) / returns.length;

  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
    returns.length;

  // Annualized volatility (assuming 252 trading days)
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

/**
 * ================================
 * Sharpe Ratio
 * (Return - RiskFreeRate) / Volatility
 * ================================
 */
export function calculateSharpeRatio(cagrPct, volatilityPct, riskFreeRate = 6) {
  if (!volatilityPct || volatilityPct <= 0) return 0;

  const excessReturn = cagrPct - riskFreeRate;
  return excessReturn / volatilityPct;
}

/**
 * ================================
 * Smart Scoring Engine
 * Duration + Risk Aware
 * ================================
 */
export function computeSmartScore(fund, durationMonths, userRisk) {
  let baseReturn = 0;

  // Duration-based return selection
  if (durationMonths <= 24) {
    baseReturn = fund.cagr1y;
  } else if (durationMonths <= 60) {
    baseReturn = fund.cagr3y;
  } else {
    baseReturn = fund.cagr5y;
  }

  let volatilityPenalty = 0;

  if (userRisk === "low") {
    volatilityPenalty = fund.volatility1y * 1.5;
  } else if (userRisk === "medium") {
    volatilityPenalty = fund.volatility1y;
  } else {
    volatilityPenalty = fund.volatility1y * 0.5;
  }

  return baseReturn - volatilityPenalty;
}

/**
 * ================================
 * Production-Safe SIP Calculation
 * ================================
 */
export function estimateSIP(target, annualReturnPct, months) {
  if (!months || months <= 0 || target <= 0) return 0;

  // Clamp return for safety
  annualReturnPct = Math.min(Math.max(annualReturnPct, 4), 18);

  const r = annualReturnPct / 100 / 12;
  const n = months;

  if (r <= 0) return Number((target / n).toFixed(2));

  const factor = (Math.pow(1 + r, n) - 1) / r;

  if (!isFinite(factor) || factor <= 0) return 0;

  return Number((target / factor).toFixed(2));
}