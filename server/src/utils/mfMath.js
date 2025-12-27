/**
 * CAGR Formula:
 * CAGR = (Ending / Beginning)^(1/years) - 1
 */
export function computeCAGR(oldNav, newNav, years) {
  if (oldNav <= 0 || newNav <= 0 || years <= 0) return 0;
  return Math.pow(newNav / oldNav, 1 / years) - 1;
}

/**
 * ✅ PRODUCTION-SAFE SIP CALCULATION
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

/**
 * Fund suitability logic
 */
export function getSuitableFundTypes(userRisk, goalMonths) {
  if (goalMonths <= 12) return ["liquid", "ultra_short"];

  if (goalMonths <= 36) {
    if (userRisk === "low") return ["short_term", "corporate_bond"];
    if (userRisk === "medium") return ["hybrid", "balanced"];
    return ["aggressive_hybrid"];
  }

  if (goalMonths <= 60) {
    if (userRisk === "low") return ["large_cap", "index"];
    if (userRisk === "medium") return ["multi_cap", "flexi_cap"];
    return ["mid_cap"];
  }

  if (userRisk === "low") return ["index", "bluechip"];
  if (userRisk === "medium") return ["flexi_cap", "multi_cap"];
  return ["mid_cap", "small_cap"];
}
