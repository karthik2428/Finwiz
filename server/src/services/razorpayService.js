// src/services/razorpayService.js
import Razorpay from "razorpay";
import crypto from "crypto";

let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn("[Razorpay] Keys missing — payment routes disabled.");
}
  
export { razorpay };


/**
 * Create order for user
 */
export async function createOrder(amount, plan, userId) {
  try {
    const shortUserId = String(userId).slice(-6);   // last 6 chars only
    const shortTime = Date.now().toString().slice(-6); // last 6 digits

    const receipt = `r_${shortUserId}_${shortTime}`; // ALWAYS < 20 chars

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt, // safe length
    };

    console.log("Creating Razorpay Order:", options);

    if (!razorpay) {
      throw new Error("Razorpay instance not initialized — missing API keys");
    }

    const order = await razorpay.orders.create(options);
    console.log("Razorpay Order Success:", order);

    return order;
  } catch (err) {
    console.error("RAZORPAY ORDER ERROR:", err?.error || err);
    throw new Error(
      err?.error?.description || err.message || "Razorpay order failed"
    );
  }
}

/**
 * Verify signature from Razorpay
 */
export function verifyPaymentSignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const body = orderId + "|" + paymentId;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}
