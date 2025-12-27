// src/routes/reportRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import { downloadMonthlyReport, sendMonthlyReportEmail } from "../controllers/reportController.js";

const router = express.Router();
router.use(protect);

// Download PDF directly
router.get("/monthly", downloadMonthlyReport);

// Generate & email PDF (premium optional)
router.post("/send-email", sendMonthlyReportEmail);

export default router;
