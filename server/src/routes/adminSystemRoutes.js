import express from "express";
import { protect } from "../middlewares/auth.js";
import { getSystemStatus, ping } from "../controllers/adminSystemController.js";

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
  next();
};

const router = express.Router();
router.use(protect, adminOnly);

router.get("/status", getSystemStatus);
router.get("/ping", ping);

export default router;
