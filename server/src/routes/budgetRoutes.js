// src/routes/budgetRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";

import {
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgets,
  getBudgetSummary
} from "../controllers/budgetController.js";

const router = express.Router();
router.use(protect);

router.post("/", createBudget);
router.get("/", getBudgets);
router.get("/summary", getBudgetSummary);
router.put("/:id", updateBudget);
router.delete("/:id", deleteBudget);

export default router;
