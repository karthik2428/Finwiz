// src/utils/riskCalculator.js
/**
 * riskCalculator.js
 * Pure math-based risk scoring:
 * Inputs: userAge, goalDurationMonths, riskAnswers (questionnaire)
 *
 * Output: { score: Number (0-100), category: "conservative"|"moderate"|"aggressive" }
 *
 * Algorithm design principle:
 * - Younger users => higher capacity for risk.
 * - Longer goal duration => higher risk tolerance.
 * - Questionnaire modifies base score.
 *
 * This is deterministic, explainable and editable.
 */

export function computeRisk({ age, durationMonths, answers }) {
  // clamp/normalize inputs
  const a = Math.max(10, Math.min(100, age || 30));
  const d = Math.max(1, Math.min(600, Math.round(durationMonths || 12)));

  // Base age score: linear map: age 20 -> 80, age 60 -> 20
  const ageScore = Math.max(0, Math.min(100, 100 - ((a - 20) * (100 / 80))));
  // Base duration score: short(<=12)=20, medium(13-60)=50, long(>60)=80 — smoother: use logistic-ish linear
  const durationScore = d <= 12 ? 20 : d <= 60 ? 50 + ((d - 13) * 30) / (60 - 13) : 80;

  // Questionnaire modifiers
  // investment_experience: none= -10, low= -3, medium=+5, high=+12
  const expMap = { none: -10, low: -3, medium: 5, high: 12 };
  const experienceMod = expMap[(answers?.investment_experience) || "none"];

  // emergency buffer: more months -> reduce risk (each month beyond 6 reduces risk by 1)
  const bufferMonths = Number(answers?.emergency_buffer_months || 3);
  const bufferMod = bufferMonths > 6 ? -Math.min(10, bufferMonths - 6) : 0;

  // time_horizon_preference: short => -10, medium => 0, long => +10
  const horizonMap = { short: -10, medium: 0, long: 10 };
  const horizonMod = horizonMap[(answers?.time_horizon_preference) || "medium"];

  // liquidity_need: high => -10, medium => 0, low => +5
  const liquidityMap = { high: -10, medium: 0, low: 5 };
  const liquidityMod = liquidityMap[(answers?.liquidity_need) || "medium"];

  // Weighted aggregation
  // Give more weight to age and duration (40% each), questionnaire total 20%
  const qTotal = experienceMod + bufferMod + horizonMod + liquidityMod; // roughly -20..+30
  const scoreRaw = (0.4 * ageScore) + (0.4 * durationScore) + (0.2 * (50 + qTotal)); // map qTotal center to 50

  // Normalize to 0..100
  const score = Math.round(Math.max(0, Math.min(100, scoreRaw)));

  // Category thresholds
  const category = score < 40 ? "conservative" : score < 70 ? "moderate" : "aggressive";

  return { score, category };
}
