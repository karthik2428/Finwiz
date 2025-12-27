// src/services/brevoService.js
import axios from "axios";

/**
 * Brevo API wrapper using v3
 */
const API_KEY = process.env.BREVO_API_KEY || "";
const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendBrevoEmail(to, subject, text, html = null) {
  if (!API_KEY) {
    console.warn("[Brevo] Missing API key — email skipped.");
    return;
  }

  const payload = {
    sender: { email: "shop24963@gmail.com", name: "FinWiz Notifications" },
    to: [{ email: to }],
    subject,
    textContent: text,
    htmlContent: html || `<p>${text}</p>`
  };

  try {
    const res = await axios.post(BREVO_URL, payload, {
      headers: { "api-key": API_KEY, "content-type": "application/json" }
    });
    return res.data;
  } catch (err) {
    console.error("[Brevo] Email failed:", err.response?.data || err.message);
  }
}
