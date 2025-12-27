import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  createPaymentOrder,
  verifyPayment,
  razorpayWebhook
} from "../controllers/paymentController.js";

const router = express.Router();

// MUST BE FIRST. MUST BE BEFORE JSON PARSER.
router.post("/webhook", (req, res, next) => {
  let data = Buffer.alloc(0);

  req.on("data", chunk => {
    data = Buffer.concat([data, chunk]);
  });

  req.on("end", () => {
    req.rawBody = data;   // ← ALWAYS CORRECT RAW BODY
    next();
  });
}, razorpayWebhook);


// JSON middleware AFTER webhook
router.use(express.json());
router.use(protect);

router.post("/order", createPaymentOrder);
router.post("/verify", verifyPayment);

export default router;
