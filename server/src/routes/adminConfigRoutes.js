// src/routes/adminConfigRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import { getAllConfig, updateConfigValues } from "../controllers/adminConfigController.js";

const router = express.Router();

router.use(protect);
router.use((req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
  next();
});

router.get("/", getAllConfig);
router.put("/", updateConfigValues);

export default router;
