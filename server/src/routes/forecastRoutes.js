// src/routes/forecastRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import { forecastSavings, compareForecast } from "../controllers/forecastController.js";

const router = express.Router();
router.use(protect);

router.get("/savings", forecastSavings);
router.get("/compare", compareForecast); // premium-only

export default router;
