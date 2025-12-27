// src/models/Payment.js
import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
  plan: { type: String, enum: ["monthly", "yearly"], required: true }
}, { timestamps: true });

const Payment = mongoose.model("Payment", PaymentSchema);
export default Payment;
