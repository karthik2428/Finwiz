// src/models/Subscription.js
import mongoose from "mongoose";

/**
 * Subscription model:
 * - user-level recurring payments detected from transactions
 * - supports subscriptions and bills
 */

const PaymentRecordSchema = new mongoose.Schema(
{
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  txId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }
},
{ _id: false }
);

const SubscriptionSchema = new mongoose.Schema(
{
  title: { type: String, required: true },

  merchantSignature: {
    type: String,
    required: true,
    index: true
  },

  // NEW FIELD
  type: {
    type: String,
    enum: ["subscription", "bill"],
    default: "subscription",
    index: true
  },

  category: {
    type: String,
    default: "Subscription"
  },

  avgAmount: { type: Number, default: 0 },

  amountStdDev: { type: Number, default: 0 },

  recurrenceDays: { type: Number, default: 30 },

  recurrenceStdDev: { type: Number, default: 0 },

  lastPayments: {
    type: [PaymentRecordSchema],
    default: []
  },

  estimatedNextDate: { type: Date },

  monthlyCost: { type: Number, default: 0 },

  active: { type: Boolean, default: true },

  priceCreep: { type: Boolean, default: false },

  detectedAt: { type: Date, default: Date.now },

  // user confirms it is real
  isConfirmed: { type: Boolean, default: false },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  }

},
{ timestamps: true }
);

// prevent duplicate subscription detection for same merchant
SubscriptionSchema.index(
  { user: 1, merchantSignature: 1 },
  { unique: true }
);

const Subscription = mongoose.model("Subscription", SubscriptionSchema);

export default Subscription;