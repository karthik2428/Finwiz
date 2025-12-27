// src/controllers/userController.js
import Joi from "joi";
import User from "../models/User.js";
import Goal from "../models/Goal.js";
import { computeRisk } from "../utils/riskCalculator.js";
import asyncHandler from "../middlewares/asyncHandler.js";

/**
 * Get current user profile
 * GET /user/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password")
  console.log("DEBUG PROFILE FETCH:", JSON.stringify(user.toJSON(), null, 2));
  console.log("DEBUG isPremium virtual:", user.isPremium);
  res.json({ user });
});

/**
 * Update profile (name, age)
 * PUT /user/profile
 */
const profileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  age: Joi.number().integer().min(10).max(120).optional(),
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { error, value } = profileSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const user = await User.findByIdAndUpdate(req.user._id, value, { new: true })
    .select("-password");

  // Recompute risk for ALL goals if age changed
  if (value.age) {
    const goals = await Goal.find({ createdBy: req.user._id });

    for (const g of goals) {
      const durationMonths =
        g.durationMonths ||
        Math.max(
          1,
          Math.round(
            (g.targetDate - g.createdAt) / (1000 * 60 * 60 * 24 * 30)
          )
        );

      const r = computeRisk({
        age: value.age,
        durationMonths,
        answers: user.riskAnswers,
      });

      g.riskScore = r.score;
      g.riskCategory = r.category;
      await g.save();
    }
  }

  res.json({ message: "Profile updated", user });
});

/**
 * Update risk questionnaire answers
 * PUT /user/risk-answers
 */
const riskAnswersSchema = Joi.object({
  investment_experience: Joi.string()
    .valid("none", "low", "medium", "high")
    .optional(),
  emergency_buffer_months: Joi.number().integer().min(0).optional(),
  time_horizon_preference: Joi.string()
    .valid("short", "medium", "long")
    .optional(),
  liquidity_need: Joi.string().valid("low", "medium", "high").optional(),
});

export const updateRiskAnswers = asyncHandler(async (req, res) => {
  const { error, value } = riskAnswersSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const user = await User.findById(req.user._id);
  user.riskAnswers = { ...user.riskAnswers.toObject(), ...value };
  await user.save();

  // Recompute risk for each goal
  const goals = await Goal.find({ createdBy: req.user._id });

  for (const g of goals) {
    const durationMonths =
      g.durationMonths ||
      Math.max(
        1,
        Math.round((g.targetDate - g.createdAt) / (1000 * 60 * 60 * 24 * 30))
      );

    const r = computeRisk({
      age: user.age,
      durationMonths,
      answers: user.riskAnswers,
    });

    g.riskScore = r.score;
    g.riskCategory = r.category;
    await g.save();
  }

  res.json({
    message: "Risk answers updated",
    riskAnswers: user.riskAnswers,
  });
});
