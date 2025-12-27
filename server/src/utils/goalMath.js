// src/utils/goalMath.js
/**
 * Utility functions for computing goal metrics:
 * - requiredMonthlySaving
 * - progress %
 * - estimated completion date
 * - difficulty score
 */

import moment from "moment";

/**
 * Required Monthly Saving Formula:
 *
 * remainingAmount / monthsLeft
 */
export function computeRequiredMonthlySaving(targetAmount, currentSaved, targetDate) {
  const now = moment();
  const end = moment(targetDate);
  const monthsLeft = Math.max(1, end.diff(now, "months", true)); // fractional months allowed

  const remaining = Math.max(0, targetAmount - currentSaved);
  const requiredMonthly = remaining / monthsLeft;

  return {
    remaining,
    monthsLeft,
    requiredMonthly: Number(requiredMonthly.toFixed(2)),
  };
}

/**
 * Difficulty Score (0–100)
 * Based purely on mathematics:
 *
 * Factors:
 *  - savingsRate = requiredMonthly / userMonthlySavingsAvg
 *  - time pressure (monthsLeft small = harder)
 *  - large remaining = harder
 *
 * Score Interpretation:
 * 0–40  → Easy
 * 40–70 → Moderate
 * 70–100 → Hard
 */
export function computeDifficultyScore(requiredMonthly, userMonthlyAverageSaving, monthsLeft) {
  if (userMonthlyAverageSaving <= 0) return 100;

  const rate = requiredMonthly / userMonthlyAverageSaving; // >1 means difficult
  let score = 0;

  // factor 1: rate of required saving vs user's ability
  if (rate <= 0.5) score += 10;
  else if (rate <= 1) score += 35;
  else if (rate <= 1.5) score += 60;
  else score += 80;

  // factor 2: months left
  if (monthsLeft <= 2) score += 20;
  else if (monthsLeft <= 6) score += 10;

  // clamp 0..100
  return Math.min(100, Math.round(score));
}

/**
 * Estimate completion date based on:
 * projected monthly saving = userMonthlyAvg
 */
export function estimateCompletionDate(currentSaved, targetAmount, userMonthlyAvg) {
  if (userMonthlyAvg <= 0) return null;

  const remaining = targetAmount - currentSaved;
  const monthsNeeded = Math.ceil(remaining / userMonthlyAvg);

  return moment().add(monthsNeeded, "months").toDate();
}
