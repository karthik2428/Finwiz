// src/utils/analyticsMath.js
/**
 * Savings Efficiency Score (0–100)
 * Re-defined as "Retention Ratio": How much of your income do you keep?
 * 
 * Target: 30% savings rate is "Perfect" (100/100)
 * We clamp at 100.
 * Score = (SavingsRate / 30) * 100.
 * Example: 
 * - 15% savings -> 50/100.
 * - 30% savings -> 100/100.
 * - 0% -> 0/100.
 */
export function computeSavingsEfficiency(monthlyIncomeAvg, monthlyExpenseAvg, actualSavingsAvg) {
  if (monthlyIncomeAvg <= 0) return 0;

  // Calculate Savings Rate
  const savingsRate = (actualSavingsAvg / monthlyIncomeAvg) * 100;

  if (savingsRate <= 0) return 0;

  // Target: 30% savings rate is "Perfect" (100/100)
  // We clamp at 100.
  const score = (savingsRate / 30) * 100;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Category Projection:
 * Predict future category expense using simple linear prediction:
 * projection = lastMonth + (lastMonth - secondLastMonth)
 * Added: prevent negative projection.
 */
export function projectCategoryExpense(history = []) {
  if (history.length < 2) return null;

  const last = history[history.length - 1];
  const secondLast = history[history.length - 2];

  // Simple momentum
  const diff = last - secondLast;

  // If trend is erratic, maybe just dampen it? 
  // For now, simple linear extrapolation
  return Math.max(0, Math.round(last + diff));
}

/**
 * Compare forecast vs actual (Bounded Percentage Difference)
 * 
 * Returns a BOUNDED percentage showing how much actual differs from forecast.
 * Capped at ±100% to prevent unrealistic values like +856%.
 * 
 * Uses Symmetric MAPE-like logic for stability with small/negative values.
 */
export function compareForecastToActual(forecast, actual) {
  // Handle edge cases
  if (forecast === 0 && actual === 0) return 0;

  // If forecast is 0 but actual is not, return capped value
  if (forecast === 0) {
    return actual > 0 ? 100 : -100;
  }

  const diff = actual - forecast;

  // Use symmetric denominator for stability (average of absolute values)
  // This prevents explosion when forecast is very small
  const avgMagnitude = (Math.abs(forecast) + Math.abs(actual)) / 2;

  if (avgMagnitude === 0) return 0;

  // Calculate percentage using symmetric approach
  let pct = (diff / avgMagnitude) * 100;

  // Cap at ±100% for UI sanity
  pct = Math.max(-100, Math.min(100, pct));

  return Number(pct.toFixed(2));
}
