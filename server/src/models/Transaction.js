// src/models/Transaction.js
import mongoose from "mongoose";

/**
 * Transaction model:
 * - kind: "income" | "expense"
 * - amount: positive number
 * - category: string (auto or user-set)
 * - merchant: string (payee / vendor)
 * - note: optional free text
 * - date: transaction date
 * - createdBy: reference to User
 * - metadata: optional (raw CSV row, original text, etc)
 */
const TransactionSchema = new mongoose.Schema({
  kind: { type: String, enum: ["income", "expense"], required: true },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, default: "Uncategorized" },
  merchant: { type: String, trim: true, default: "" },
  note: { type: String, default: "" },
  date: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

// Compound index for faster user/date queries
TransactionSchema.index({ createdBy: 1, date: -1 });

const Transaction = mongoose.model("Transaction", TransactionSchema);
export default Transaction;
