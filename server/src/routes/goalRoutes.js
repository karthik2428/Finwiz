// src/routes/goalRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";

import {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
  goalSummary
} from "../controllers/goalController.js";

const router = express.Router();
router.use(protect);

router.post("/", createGoal);
router.get("/", getGoals);
router.get("/:id/summary", goalSummary);
router.put("/:id", updateGoal);
router.delete("/:id", deleteGoal);

export default router;
