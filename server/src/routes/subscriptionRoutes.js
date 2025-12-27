// src/routes/subscriptionRoutes.js
import express from "express";
import {
  scanSubscriptions, listSubscriptions, updateSubscription,
  deleteSubscription, subscriptionSummary
} from "../controllers/subscriptionController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();
router.use(protect);

router.post("/scan", scanSubscriptions); // manual trigger
router.get("/", listSubscriptions);
router.get("/summary", subscriptionSummary);
router.put("/:id", updateSubscription);
router.delete("/:id", deleteSubscription);

export default router;
