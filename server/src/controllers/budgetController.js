// src/controllers/budgetController.js
import Joi from "joi";
import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import moment from "moment";

/**
 * Validation Schema
 */
const budgetSchema = Joi.object({
  category: Joi.string().min(2).max(50).required(),
  limitAmount: Joi.number().positive().required(),
  month: Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/).required() // YYYY-MM
});

const updateBudgetSchema = Joi.object({
  category: Joi.string().min(2).max(50).optional(),
  limitAmount: Joi.number().positive().optional(),
});

/**
 * Create budget
 * POST /budget
 */
export const createBudget = asyncHandler(async (req, res) => {
  const { error, value } = budgetSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const budget = new Budget({
      category: value.category,
      limitAmount: value.limitAmount,
      month: value.month,
      createdBy: req.user._id,
    });

    await budget.save();
    return res.status(201).json({ message: "Budget created", budget });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Budget already exists for this category and month" });
    }
    throw err;
  }
});

/**
 * Update budget
 * PUT /budget/:id
 */
export const updateBudget = asyncHandler(async (req, res) => {
  const { error, value } = updateBudgetSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const budget = await Budget.findOne({ _id: req.params.id, createdBy: req.user._id });
  if (!budget) return res.status(404).json({ message: "Budget not found" });

  Object.assign(budget, value);

  try {
    await budget.save();
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate budget for this category and month" });
    }
    throw err;
  }

  res.json({ message: "Budget updated", budget });
});

/**
 * Delete budget
 * DELETE /budget/:id
 */
export const deleteBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
  if (!budget) return res.status(404).json({ message: "Budget not found" });
  res.json({ message: "Budget deleted" });
});

/**
 * Get all budgets for selected month
 * GET /budget?month=YYYY-MM
 */
export const getBudgets = asyncHandler(async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ message: "month is required" });

  const budgets = await Budget.find({ createdBy: req.user._id, month }).sort({ category: 1 });
  res.json({ month, budgets });
});

/**
 * Get budget usage summary
 * GET /budget/summary?month=YYYY-MM
 * Computes spending per category and alerts
 */
export const getBudgetSummary = asyncHandler(async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ message: "month is required" });

  const start = moment(month, "YYYY-MM").startOf("month").toDate();
  const end = moment(month, "YYYY-MM").endOf("month").toDate();

  const budgets = await Budget.find({ createdBy: req.user._id, month });

  // Prepare summary result
  const summary = [];

  for (const b of budgets) {
    // Compute spending for category
    const totalSpent = await Transaction.aggregate([
      {
        $match: {
          createdBy: req.user._id,
          category: b.category,
          kind: "expense",
          date: { $gte: start, $lte: end }
        }
      },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const spent = totalSpent.length ? totalSpent[0].total : 0;

    const percentUsed = (spent / b.limitAmount) * 100;
    let alert = "none";

    if (percentUsed >= 100) alert = "limit_reached";
    else if (percentUsed >= 80) alert = "near_limit";

    summary.push({
      _id: b._id,
      category: b.category,
      limitAmount: b.limitAmount,
      spent,
      percentUsed: Number(percentUsed.toFixed(2)),
      alert,
    });
  }

  res.json({ month, summary });
});
