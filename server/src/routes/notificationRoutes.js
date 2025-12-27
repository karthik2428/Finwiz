// src/routes/notificationRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import { getNotifications, markAsRead } from "../controllers/notificationController.js";

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.put("/:id/read", markAsRead);

export default router;
