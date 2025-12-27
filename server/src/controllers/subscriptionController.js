// src/controllers/subscriptionController.js
import Transaction from "../models/Transaction.js";
import Subscription from "../models/Subscription.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { detectSubscriptionsFromTransactions } from "../utils/subscriptionDetector.js";
import Joi from "joi";
import mongoose from "mongoose";

/**
 * POST /subscriptions/scan
 * Manual trigger to scan user's transactions and create/update subscription records.
 * Optional query param: lookbackMonths (default 12)
 */
export const scanSubscriptions = asyncHandler(async (req, res) => {
  const lookbackMonths = Math.max(1, Number(req.query.lookbackMonths || 12));
  const since = new Date();
  since.setMonth(since.getMonth() - lookbackMonths);

  // fetch transactions for user (only expenses)
  const txs = await Transaction.find({
    createdBy: req.user._id,
    kind: "expense",
    date: { $gte: since }
  }).sort({ date: 1 });

  const detected = detectSubscriptionsFromTransactions(txs, {
    nameSimilarityThreshold: 0.8,
    minPayments: 3,
    recurrenceToleranceDays: 5,
    amountVariationPct: 0.25,
    priceCreepWindow: 4,
    priceCreepPct: 0.08,
  });

  const createdOrUpdated = [];
  for (const d of detected) {
    // Upsert subscription by merchantSignature + user
    const existing = await Subscription.findOne({ user: req.user._id, merchantSignature: d.merchantSignature });
    const paymentRecords = d.payments.map(p => ({ date: p.date, amount: p.amount, txId: p.txId }));

    if (existing) {
      existing.title = d.title;
      existing.category = existing.category || "Subscription";
      existing.avgAmount = d.avgAmount;
      existing.amountStdDev = d.amountStdDev;
      existing.recurrenceDays = d.recurrenceDays;
      existing.recurrenceStdDev = d.recurrenceStdDev;
      existing.lastPayments = paymentRecords;
      existing.estimatedNextDate = d.estimatedNextDate;
      existing.monthlyCost = d.monthlyCost;
      existing.priceCreep = d.priceCreep;
      existing.detectedAt = new Date();
      await existing.save();
      createdOrUpdated.push({ action: "updated", subscription: existing });
    } else {
      const s = new Subscription({
        title: d.title,
        merchantSignature: d.merchantSignature,
        category: "Subscription",
        avgAmount: d.avgAmount,
        amountStdDev: d.amountStdDev,
        recurrenceDays: d.recurrenceDays,
        recurrenceStdDev: d.recurrenceStdDev,
        lastPayments: paymentRecords,
        estimatedNextDate: d.estimatedNextDate,
        monthlyCost: d.monthlyCost,
        priceCreep: d.priceCreep,
        user: req.user._id,
        isConfirmed: false,
        active: true,
      });
      await s.save();
      createdOrUpdated.push({ action: "created", subscription: s });
    }
  }

  res.json({
    message: "Scan completed",
    detectedCount: detected.length,
    details: createdOrUpdated
  });
});

/**
 * GET /subscriptions
 * List subscriptions for current user
 * query: active (true/false/all), confirmed (true/false/all)
 */
export const listSubscriptions = asyncHandler(async (req, res) => {
  const { active, confirmed, page = 1, limit = 50 } = req.query;
  const filters = { user: req.user._id };

  if (active === "true") filters.active = true;
  else if (active === "false") filters.active = false;

  if (confirmed === "true") filters.isConfirmed = true;
  else if (confirmed === "false") filters.isConfirmed = false;

  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
  const subs = await Subscription.find(filters).sort({ detectedAt: -1 }).skip(skip).limit(Number(limit));
  const total = await Subscription.countDocuments(filters);
  res.json({ meta: { total, page: Number(page), limit: Number(limit) }, subscriptions: subs });
});

/**
 * PUT /subscriptions/:id
 * Update subscription (confirm, active toggle, category, title)
 */
const updateSchema = Joi.object({
  title: Joi.string().optional(),
  category: Joi.string().optional(),
  isConfirmed: Joi.boolean().optional(),
  active: Joi.boolean().optional()
});

export const updateSubscription = asyncHandler(async (req, res) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid id" });

  const sub = await Subscription.findOne({ _id: req.params.id, user: req.user._id });
  if (!sub) return res.status(404).json({ message: "Subscription not found" });

  Object.assign(sub, value);
  await sub.save();
  res.json({ message: "Subscription updated", subscription: sub });
});

/**
 * DELETE /subscriptions/:id
 */
export const deleteSubscription = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid id" });
  const sub = await Subscription.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!sub) return res.status(404).json({ message: "Subscription not found" });
  res.json({ message: "Subscription deleted" });
});

/**
 * GET /subscriptions/summary
 * Returns total estimated monthly subscription cost and price creep list
 */
export const subscriptionSummary = asyncHandler(async (req, res) => {
  const subs = await Subscription.find({ user: req.user._id, active: true });
  const totalMonthly = subs.reduce((s, x) => s + (x.monthlyCost || 0), 0);
  const priceCreeps = subs.filter(s => s.priceCreep);
  res.json({ totalMonthly, count: subs.length, priceCreeps });
});
