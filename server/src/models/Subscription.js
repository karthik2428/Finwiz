// src/models/Subscription.js
import mongoose from "mongoose";

/**
 * Subscription model:
 * - user-level subscription candidate detected from transactions
 * - Each user can have multiple subscriptions
 *
 * Fields:
 * - title: friendly name (from merchant)
 * - merchantSignature: canonical merchant string (normalized)
 * - category: suggested category
 * - avgAmount: average paid amount
 * - amountStdDev: std dev of amounts
 * - recurrenceDays: detected recurrence period (e.g., 30)
 * - recurrenceStdDev: variation in days
 * - lastPayments: [{ date, amount, txId }]
 * - estimatedNextDate: next renewal estimate
 * - monthlyCost: estimated monthly cost (avgAmount * monthlyFactor)
 * - active: boolean (user can disable)
 * - priceCreep: boolean (true if price creeping detected)
 * - detectedAt: when detected
 * - isConfirmed: user flag when they confirm it's a subscription
 */
const PaymentRecordSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  txId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
}, { _id: false });

const SubscriptionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  merchantSignature: { type: String, required: true, index: true },
  category: { type: String, default: "Subscription" },
  avgAmount: { type: Number, default: 0 },
  amountStdDev: { type: Number, default: 0 },
  recurrenceDays: { type: Number, default: 30 },
  recurrenceStdDev: { type: Number, default: 0 },
  lastPayments: { type: [PaymentRecordSchema], default: [] },
  estimatedNextDate: { type: Date },
  monthlyCost: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  priceCreep: { type: Boolean, default: false },
  detectedAt: { type: Date, default: Date.now },
  isConfirmed: { type: Boolean, default: false }, // user confirms subscription
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }
}, { timestamps: true });

SubscriptionSchema.index({ user: 1, merchantSignature: 1 }, { unique: true });

const Subscription = mongoose.model("Subscription", SubscriptionSchema);
export default Subscription;
