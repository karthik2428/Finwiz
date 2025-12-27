// src/models/Budget.js
import mongoose from "mongoose";

/**
 * A budget belongs to one user and one category for a given month.
 * month format: "YYYY-MM"
 */
const BudgetSchema = new mongoose.Schema({
  category: { type: String, required: true, trim: true },
  limitAmount: { type: Number, required: true, min: 1 },
  month: { type: String, required: true }, // "2025-01" format
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
}, { timestamps: true });

// Ensure 1 budget per category per month for a user
BudgetSchema.index({ createdBy: 1, category: 1, month: 1 }, { unique: true });

const Budget = mongoose.model("Budget", BudgetSchema);
export default Budget;
