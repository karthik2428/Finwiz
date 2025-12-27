// src/controllers/adminPaymentController.js
import asyncHandler from "../middlewares/asyncHandler.js";
import Payment from "../models/Payment.js";

export const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({})
    .populate("user", "email name")
    .sort({ createdAt: -1 });

  res.json({ payments });
});
