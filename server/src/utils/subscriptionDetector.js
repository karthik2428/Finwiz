import stringSimilarity from "string-similarity";
import _ from "lodash";

/*
This detector now:
1. Detects recurrence
2. Classifies merchant
3. Filters recurring expenses like groceries/dining
*/

const SUBSCRIPTION_KEYWORDS = [
  "netflix","spotify","youtube","prime","amazon","adobe","apple",
  "google","microsoft","chatgpt","dropbox","canva","zoom","disney"
];

const BILL_KEYWORDS = [
  "electricity","power","internet","wifi","broadband","gas",
  "water","mobile","phone","telecom","airtel","jio","bsnl"
];

const IGNORE_KEYWORDS = [
  "grocery","supermarket","restaurant","dining","food",
  "fuel","petrol","diesel","uber","ola","swiggy","zomato"
];

function normalizeMerchant(s = "") {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(upi|pos|card|payment|txn)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function classifyMerchant(name) {
  const merchant = name.toLowerCase();

  if (IGNORE_KEYWORDS.some(k => merchant.includes(k))) return "ignore";
  if (SUBSCRIPTION_KEYWORDS.some(k => merchant.includes(k))) return "subscription";
  if (BILL_KEYWORDS.some(k => merchant.includes(k))) return "bill";

  return "unknown";
}

function computeIntervals(dates) {
  if (dates.length < 2) return [];

  const intervals = [];

  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round(
      (new Date(dates[i]) - new Date(dates[i - 1])) / (1000 * 60 * 60 * 24)
    );
    intervals.push(diff);
  }

  return intervals;
}

function stats(values = []) {
  if (!values.length) return { mean: 0, std: 0 };

  const mean = _.mean(values);
  const variance = _.mean(values.map(v => Math.pow(v - mean, 2)));

  return {
    mean,
    std: Math.sqrt(variance)
  };
}

function mode(values = []) {
  if (!values.length) return null;

  const map = {};
  let max = 0;
  let best = null;

  for (const v of values) {
    map[v] = (map[v] || 0) + 1;
    if (map[v] > max) {
      max = map[v];
      best = v;
    }
  }

  return best;
}

export function detectSubscriptionsFromTransactions(transactions = [], options = {}) {

  const {
    nameSimilarityThreshold = 0.8,
    minPayments = 3,
    recurrenceToleranceDays = 5,
    amountVariationPct = 0.25,
    priceCreepWindow = 4,
    priceCreepPct = 0.08
  } = options;

  const txs = transactions.map(t => ({
    id: String(t._id),
    merchantRaw: t.merchant || t.note || "",
    merchantNorm: normalizeMerchant(t.merchant || t.note || ""),
    date: new Date(t.date),
    amount: Number(t.amount),
    txId: t._id
  }));

  const clusters = [];

  for (const tx of txs) {

    let placed = false;

    for (const c of clusters) {

      const score = stringSimilarity.compareTwoStrings(
        tx.merchantNorm,
        c.signature
      );

      if (score >= nameSimilarityThreshold) {
        c.txs.push(tx);
        placed = true;
        break;
      }
    }

    if (!placed) {
      clusters.push({
        signature: tx.merchantNorm,
        txs: [tx]
      });
    }
  }

  const detected = [];

  for (const c of clusters) {

    const payments = c.txs
      .filter(t => t.amount > 0)
      .sort((a, b) => a.date - b.date);

    if (payments.length < minPayments) continue;

    const merchantType = classifyMerchant(c.signature);

    if (merchantType === "ignore") continue;

    const dates = payments.map(p => p.date);
    const intervals = computeIntervals(dates);

    if (!intervals.length) continue;

    const modeInterval = mode(intervals) || Math.round(_.mean(intervals));

    const { mean: meanInterval, std: stdInterval } = stats(intervals);

    const withinToleranceCount = intervals.filter(i =>
      Math.abs(i - modeInterval) <= recurrenceToleranceDays
    ).length;

    const recurrenceConfidence = withinToleranceCount / intervals.length;

    const amounts = payments.map(p => p.amount);

    const { mean: meanAmount, std: stdAmount } = stats(amounts);

    const amountCv = meanAmount === 0 ? 0 : stdAmount / meanAmount;

    // Ignore large payments (likely rent)
    if (meanAmount > 15000) continue;

    // Ignore unstable amounts
    if (amountCv > amountVariationPct) continue;

    // Only detect near monthly patterns
    if (modeInterval < 20 || modeInterval > 40) continue;

    const isRecurring =
      recurrenceConfidence >= 0.6;

    if (!isRecurring) continue;

    let priceCreep = false;

    if (payments.length >= priceCreepWindow) {

      const lastN = payments.slice(-priceCreepWindow).map(p => p.amount);

      let slope = 0;

      for (let i = 1; i < lastN.length; i++) {
        slope += (lastN[i] - lastN[i - 1]) / lastN[i - 1];
      }

      const avgSlope = slope / (lastN.length - 1);

      if (avgSlope >= priceCreepPct) priceCreep = true;
    }

    const lastDate = dates[dates.length - 1];

    const estimatedNextDate = new Date(
      lastDate.getTime() + modeInterval * 24 * 60 * 60 * 1000
    );

    const monthlyCost =
      modeInterval > 0
        ? meanAmount * (30 / modeInterval)
        : meanAmount;

    detected.push({
      title: payments[0].merchantRaw || c.signature,
      merchantSignature: c.signature,
      type: merchantType === "bill" ? "bill" : "subscription",
      payments: payments.map(p => ({
        date: p.date,
        amount: p.amount,
        txId: p.txId
      })),
      avgAmount: meanAmount,
      amountStdDev: stdAmount,
      recurrenceDays: modeInterval,
      recurrenceStdDev: stdInterval,
      recurrenceConfidence,
      estimatedNextDate,
      monthlyCost,
      priceCreep
    });
  }

  return detected;
}