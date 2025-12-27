// src/utils/forecastMath.js
/**
 * forecastMath.js
 * Functions:
 *  - computeWMA(series, weights)
 *  - prepareMonthlySavings(transactions, monthsBack)
 *
 * series: array of numbers ordered from oldest -> newest
 * weights: array of same length with positive weights, where last weight corresponds to newest value
 */

import moment from "moment";

/**
 * computeWMA
 * series: [oldest, ..., newest]
 * weights: [w_oldest, ..., w_newest]
 */
export function computeWMA(series = [], weights = []) {
  if (!Array.isArray(series) || !Array.isArray(weights)) throw new Error("Invalid args");
  const n = Math.min(series.length, weights.length);
  if (n === 0) return 0;

  // Align to last n elements
  const s = series.slice(-n);
  const w = weights.slice(-n);

  // Compute weighted sum
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const val = Number(s[i]) || 0;
    const wt = Number(w[i]) || 0;
    num += val * wt;
    den += wt;
  }
  return den === 0 ? 0 : (num / den);
}

/**
 * prepareMonthlySavings
 * transactions: array of transaction docs with {date, kind, amount}
 * monthsBack: integer (how many months to prepare, including current partial month)
 *
 * returns array [oldest,...,newest] of monthly savings numbers (income - expense)
 */
export function prepareMonthlySavings(transactions = [], monthsBack = 6) {
  const now = moment();
  // Create buckets keyed by "YYYY-MM" from monthsBack-1 months ago to current month
  const buckets = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const m = moment().subtract(i, "months");
    buckets.push({ key: m.format("YYYY-MM"), income: 0, expense: 0 });
  }

  const map = {};
  for (const b of buckets) map[b.key] = b;

  // Populate buckets
  for (const t of transactions) {
    const d = moment(t.date);
    const key = d.format("YYYY-MM");
    if (map[key]) {
      if (t.kind === "income") map[key].income += Number(t.amount) || 0;
      else if (t.kind === "expense") map[key].expense += Number(t.amount) || 0;
    }
  }

  // Return savings series oldest->newest
  return buckets.map(b => (b.income - b.expense));
}
