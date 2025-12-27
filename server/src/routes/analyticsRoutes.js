// src/routes/analyticsRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";

import {
  getBasicAnalytics,
  getPremiumAnalytics
} from "../controllers/analyticsController.js";

const router = express.Router();

router.use(protect);

router.get("/basic", getBasicAnalytics);
router.get("/premium", getPremiumAnalytics);

export default router;
