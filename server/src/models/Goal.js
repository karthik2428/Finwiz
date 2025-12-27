// src/models/Goal.js
import mongoose from "mongoose";

/**
 Each goal stores: title, targetAmount, targetDate, createdBy,
 durationMonths (computed), and computed riskScore & riskCategory
*/
const GoalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  targetAmount: { type: Number, required: true, min: 0 },
  currentAmount: { type: Number, default: 0, min: 0 },
  targetDate: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  durationMonths: { type: Number }, // computed at creation
  riskScore: { type: Number, default: 0 }, // computed numeric score
  riskCategory: { type: String, enum: ["conservative", "moderate", "aggressive"], default: "moderate" },
  createdAt: { type: Date, default: Date.now },
});

const Goal = mongoose.model("Goal", GoalSchema);
export default Goal;
