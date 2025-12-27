// src/utils/subscriptionDetector.js
/**
 * subscriptionDetector.js
 * Implements rules to detect recurring subscriptions from a user's transactions.
 *
 * Inputs:
 *  - transactions: array of Transaction documents for a single user (prefer recent 12 months)
 *  - options: thresholds for similarity, recurrence window, amount variation
 *
 * Outputs:
 *  - list of detected subscription objects { merchantSignature, merchant, payments: [{date,amount,txId}], avgAmount, recurrenceDays, ... }
 *
 * Algorithm summary:
 * 1. Normalize merchant strings (lowercase, remove punctuation).
 * 2. Group candidate transactions by merchant similarity using string-similarity.
 * 3. For each group, compute sorted payment dates, compute intervals between payments.
 * 4. If a dominant interval exists (mode near 7/30/365 or consistent within tolerance), mark as recurring.
 * 5. Compute amount stability; if amounts stable within threshold, it's stronger signal.
 * 6. Price creep detection: detect monotonic increasing trend beyond threshold.
 */

import stringSimilarity from "string-similarity";
import _ from "lodash";

/* helper: normalize merchant string */
function normalizeMerchant(s = "") {
  return (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/* helper: compute intervals (days) between sorted dates */
function computeIntervals(dates) {
  if (!dates || dates.length < 2) return [];
  const intervals = [];
  for (let i = 1; i < dates.length; i++) {
    const a = new Date(dates[i - 1]);
    const b = new Date(dates[i]);
    const diffDays = Math.round(Math.abs((b - a) / (1000 * 60 * 60 * 24)));
    intervals.push(diffDays);
  }
  return intervals;
}

/* helper: mean & std dev */
function stats(values = []) {
  if (!values.length) return { mean: 0, std: 0, median: 0 };
  const mean = _.mean(values);
  const median = _.median ? _.median(values) : values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
  const variance = _.mean(values.map(v => Math.pow(v - mean, 2)));
  return { mean, std: Math.sqrt(variance), median };
}

/* compute mode (most common) element of an array */
function mode(values = []) {
  if (!values.length) return null;
  const counts = {};
  let best = null; let bestCount = 0;
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
    if (counts[v] > bestCount) { best = v; bestCount = counts[v]; }
  }
  return best;
}

export function detectSubscriptionsFromTransactions(transactions = [], options = {}) {
  const {
    nameSimilarityThreshold = 0.8, // merchant name similarity to group
    minPayments = 3,              // need >= 3 occurrences to detect recurring
    recurrenceToleranceDays = 5,  // allowed jitter around mode interval
    amountVariationPct = 0.2,     // 20% amount variation allowed for stable
    priceCreepWindow = 4,         // last N payments to check price creep
    priceCreepPct = 0.08,         // 8% sustained increase flagged as creep
  } = options;

  // Normalize merchants and attach
  const txs = transactions.map(t => ({
    id: String(t._id),
    merchantRaw: t.merchant || t.note || "",
    merchantNorm: normalizeMerchant(t.merchant || t.note || ""),
    date: new Date(t.date),
    amount: Number(t.amount),
    txId: t._id,
  }));

  // Build clusters using greedy similarity linking
  const clusters = []; // each cluster: { merchants: [norm], txs: [] }
  for (const tx of txs) {
    let placed = false;
    for (const c of clusters) {
      // compare with cluster signature (first merchant)
      const base = c.signature;
      const score = stringSimilarity.compareTwoStrings(tx.merchantNorm, base);
      if (score >= nameSimilarityThreshold) {
        c.txs.push(tx);
        placed = true;
        break;
      }
    }
    if (!placed) {
      clusters.push({ signature: tx.merchantNorm, txs: [tx] });
    }
  }

  const detected = [];

  for (const c of clusters) {
    // Only expenses considered for subscriptions (payments from user)
    const payments = c.txs.filter(t => t.amount > 0).sort((a,b) => a.date - b.date);
    if (payments.length < minPayments) continue;

    const dates = payments.map(p => p.date);
    const intervals = computeIntervals(dates); // days between payments
    if (!intervals.length) continue;

    // compute statistics
    const modeInterval = mode(intervals) || Math.round(_.mean(intervals));
    const { mean: meanInterval, std: stdInterval } = stats(intervals);

    // evaluate if recurrence consistent: count of intervals within tolerance of mode
    const withinToleranceCount = intervals.filter(i => Math.abs(i - modeInterval) <= recurrenceToleranceDays).length;
    const recurrenceConfidence = withinToleranceCount / intervals.length;

    // treat common cycles near 7,14,30,365 as stronger signals
    const commonIntervals = [7, 14, 28, 30, 31, 365];
    const closeToCommon = commonIntervals.some(ci => Math.abs(modeInterval - ci) <= recurrenceToleranceDays);

    // amount stats
    const amounts = payments.map(p => p.amount);
    const { mean: meanAmount, std: stdAmount } = stats(amounts);

    const avgAmount = meanAmount;
    const amountCv = meanAmount === 0 ? 0 : (stdAmount / meanAmount); // coefficient of variation

    // decide subscription: recurrenceConfidence high OR closeToCommon && reasonable amount consistency
    const isRecurring = (recurrenceConfidence >= 0.6) || (closeToCommon && amountCv <= amountVariationPct);

    if (!isRecurring) continue;

    // price creep detection: check last N payments for upward trend
    let priceCreep = false;
    if (payments.length >= priceCreepWindow) {
      const lastN = payments.slice(-priceCreepWindow).map(p => p.amount);
      // compute linear slope approximate
      let slopeSum = 0;
      for (let i = 1; i < lastN.length; i++) {
        slopeSum += (lastN[i] - lastN[i-1]) / lastN[i-1];
      }
      const avgPctInc = slopeSum / (lastN.length - 1);
      if (avgPctInc >= priceCreepPct) priceCreep = true;
    }

    // estimate next date: last payment date + modeInterval
    const lastDate = dates[dates.length - 1];
    const estimatedNextDate = new Date(lastDate.getTime() + modeInterval * 24*60*60*1000);

    // monthlyCost: scale by modeInterval (if modeInterval ~30 => monthly cost = avgAmount)
    const monthlyCost = modeInterval > 0 ? (avgAmount * (30 / modeInterval)) : avgAmount;

    detected.push({
      title: payments[0].merchantRaw || c.signature,
      merchantSignature: c.signature,
      payments: payments.map(p => ({ date: p.date, amount: p.amount, txId: p.txId })),
      avgAmount,
      amountStdDev: stdAmount,
      recurrenceDays: modeInterval,
      recurrenceStdDev: stdInterval,
      recurrenceConfidence,
      estimatedNextDate,
      monthlyCost,
      priceCreep,
      detectionSummary: {
        paymentsCount: payments.length,
        intervals,
      }
    });
  }

  return detected;
}
