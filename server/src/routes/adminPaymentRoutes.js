import express from "express";
import { protect } from "../middlewares/auth.js";
import { getAllPayments } from "../controllers/adminPaymentController.js";

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
  next();
};

const router = express.Router();
router.use(protect, adminOnly);

router.get("/", getAllPayments);

export default router;
