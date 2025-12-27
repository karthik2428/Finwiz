// src/controllers/goalController.js
import Joi from "joi";
import Goal from "../models/Goal.js";
import Transaction from "../models/Transaction.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { computeRisk } from "../utils/riskCalculator.js";
import {
  computeRequiredMonthlySaving,
  computeDifficultyScore,
  estimateCompletionDate,
} from "../utils/goalMath.js";

/**
 * Helper: compute user's average monthly savings
 */
async function getUserMonthlySavingAverage(userId, months = 6) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const income = await Transaction.aggregate([
    { $match: { createdBy: userId, kind: "income", date: { $gte: since } } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const expense = await Transaction.aggregate([
    { $match: { createdBy: userId, kind: "expense", date: { $gte: since } } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const totalIncome = income[0]?.total || 0;
  const totalExpense = expense[0]?.total || 0;
  const netSaved = totalIncome - totalExpense;

  return netSaved > 0 ? netSaved / months : 0;
}

/**
 * Create Goal
 */
const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow("").optional(),
  targetAmount: Joi.number().positive().required(),
  currentAmount: Joi.number().min(0).optional(),
  targetDate: Joi.date().required(),
});

export const createGoal = asyncHandler(async (req, res) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const user = req.user;

  // Duration
  const now = new Date();
  const target = new Date(value.targetDate);
  const durationMonths = Math.max(
    1,
    Math.round((target - now) / (1000 * 60 * 60 * 24 * 30))
  );

  // Risk score
  const risk = computeRisk({
    age: user.age,
    durationMonths,
    answers: user.riskAnswers,
  });

  // Financial projections
  const userMonthlyAvg = await getUserMonthlySavingAverage(user._id);
  const initialSaved = value.currentAmount || 0;

  const financial = computeRequiredMonthlySaving(
    value.targetAmount,
    initialSaved,
    value.targetDate
  );

  // Create
  const goal = new Goal({
    title: value.title,
    description: value.description,
    targetAmount: value.targetAmount,
    currentAmount: initialSaved,
    targetDate: value.targetDate,
    durationMonths,
    riskScore: risk.score,
    riskCategory: risk.category,
    createdBy: user._id,
  });

  await goal.save();

  res.status(201).json({
    message: "Goal created",
    goal,
    requiredMonthlySaving: financial.requiredMonthly,
    difficultyScore: computeDifficultyScore(
      financial.requiredMonthly,
      userMonthlyAvg,
      financial.monthsLeft
    ),
  });
});

/**
 * Get all goals with progress calculations
 */
export const getGoals = asyncHandler(async (req, res) => {
  const goals = await Goal.find({ createdBy: req.user._id }).sort({
    createdAt: -1,
  });

  const enriched = [];

  for (const g of goals) {
    // How much user saved toward this goal (based on category == title)
    const contrib = await Transaction.aggregate([
      { $match: { createdBy: req.user._id, kind: "income", category: g.title } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const transactionSaved = contrib[0]?.total || 0;
    const baseSaved = g.currentAmount || 0;
    const currentSaved = baseSaved + transactionSaved;

    const stats = computeRequiredMonthlySaving(
      g.targetAmount,
      currentSaved,
      g.targetDate
    );

    enriched.push({
      ...g.toObject(),
      currentSaved, // This is total (base + transactions)
      transactionSaved,
      baseSaved,
      remaining: stats.remaining,
      requiredMonthlySaving: stats.requiredMonthly,
      monthsLeft: stats.monthsLeft,
    });
  }

  res.json({ goals: enriched });
});

/**
 * Update Goal
 */
const updateSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  targetAmount: Joi.number().positive().optional(),
  currentAmount: Joi.number().min(0).optional(),
  targetDate: Joi.date().optional(),
});

export const updateGoal = asyncHandler(async (req, res) => {
  // Ensure schema includes currentAmount
  console.log("UPDATE GOAL BODY:", req.body);
  const { error, value } = updateSchema.validate(req.body);
  if (error) {
    console.log("VALIDATION ERROR:", error.message);
    return res.status(400).json({ message: error.message });
  }

  const goal = await Goal.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  });
  if (!goal) return res.status(404).json({ message: "Goal not found" });

  Object.assign(goal, value);

  if (value.targetDate) {
    const now = new Date();
    const newDuration = Math.max(
      1,
      Math.round((new Date(value.targetDate) - now) / (1000 * 60 * 60 * 24 * 30))
    );

    goal.durationMonths = newDuration;

    const risk = computeRisk({
      age: req.user.age,
      durationMonths: newDuration,
      answers: req.user.riskAnswers,
    });

    goal.riskScore = risk.score;
    goal.riskCategory = risk.category;
  }

  await goal.save();

  res.json({ message: "Goal updated", goal });
});

/**
 * Delete Goal
 */
export const deleteGoal = asyncHandler(async (req, res) => {
  const goal = await Goal.findOneAndDelete({
    _id: req.params.id,
    createdBy: req.user._id,
  });

  if (!goal) return res.status(404).json({ message: "Goal not found" });

  res.json({ message: "Goal deleted" });
});

/**
 * Goal Summary (progress + projections)
 */
export const goalSummary = asyncHandler(async (req, res) => {
  const goal = await Goal.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  });

  if (!goal) return res.status(404).json({ message: "Goal not found" });

  const currentSaved = goal.currentAmount || 0;

  const stats = computeRequiredMonthlySaving(
    goal.targetAmount,
    currentSaved,
    goal.targetDate
  );

  res.json({
    goal,
    currentSaved,
    progressPct: Number(
      ((currentSaved / goal.targetAmount) * 100).toFixed(2)
    ),
    remaining: stats.remaining,
    requiredMonthlySaving: stats.requiredMonthly,
    monthsLeft: stats.monthsLeft,
  });
});
