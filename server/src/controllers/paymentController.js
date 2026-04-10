// src/controllers/paymentController.js
import asyncHandler from "../middlewares/asyncHandler.js";
import { razorpay, createOrder, verifyPaymentSignature } from "../services/razorpayService.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";


export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (!signature) {
      return res.status(400).json({ message: "Missing signature header" });
    }

    const rawBody = req.rawBody;

    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const json = JSON.parse(rawBody.toString());
    console.log("WEBHOOK EVENT:", json.event);

    return res.json({ status: "ok" });

  } catch (err) {
    console.error("WEBHOOK ERROR:", err.message);
    return res.status(400).json({ message: "Invalid webhook body" });
  }
};




/**
 * POST /payment/order
 * Body: { plan: "monthly" | "yearly" }
 */
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  if (!["monthly", "yearly"].includes(plan))
    return res.status(400).json({ message: "Invalid plan" });

  const amount = plan === "monthly" ? 99 : 999; // example values

  const order = await createOrder(amount, plan, req.user._id);

  const payment = await Payment.create({
    user: req.user._id,
    razorpayOrderId: order.id,
    amount,
    plan,
    status: "created",
  });

  res.json({
    orderId: order.id,
    amount,
    currency: "INR",
  });
});

/**
 * POST /payment/verify
 * Body: { orderId, paymentId, signature }
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  const isValid = verifyPaymentSignature(orderId, paymentId, signature);
  if (!isValid) return res.status(400).json({ message: "Invalid signature" });

  const payment = await Payment.findOne({ razorpayOrderId: orderId });
  if (!payment) return res.status(404).json({ message: "Payment not found" });

  payment.razorpayPaymentId = paymentId;
  payment.razorpaySignature = signature;
  payment.status = "paid";
  await payment.save();

  // Activate premium account
  const user = await User.findById(payment.user);
  const start = new Date();
  const expiry = new Date(start);

  if (payment.plan === "monthly") expiry.setDate(start.getDate() + 30);
  if (payment.plan === "yearly") expiry.setFullYear(start.getFullYear() + 1);

  user.premium = {
    isActive: true,
    startDate: start,
    expiryDate: expiry,
    plan: payment.plan
  };

  await user.save();

  res.json({ message: "Payment verified, premium activated", expiryDate: expiry });
});
