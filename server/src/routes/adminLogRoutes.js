// src/routes/adminLogRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import { getLogs, deleteOldLogs } from "../controllers/adminLogController.js";

const router = express.Router();

router.use(protect);
router.use((req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
  next();
});

router.get("/", getLogs);
router.delete("/old", deleteOldLogs);

export default router;
