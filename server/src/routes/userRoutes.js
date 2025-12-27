// src/routes/userRoutes.js
import express from "express";
import {
  getProfile, updateProfile, updateRiskAnswers
} from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect); // all routes require auth

router.get("/profile", getProfile);
router.put("/profile", updateProfile);

router.put("/risk-answers", updateRiskAnswers);

export default router;
