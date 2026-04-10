// src/services/brevoService.js
import axios from "axios";

/**
 * Brevo API wrapper (v3)
 * Supports attachments
 */

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendBrevoEmail({
  to,
  subject,
  text,
  html = null,
  attachments = []
}) {

  const API_KEY = process.env.BREVO_API_KEY;

  if (!API_KEY) {
    throw new Error("BREVO_API_KEY is missing in environment variables");
  }

  const payload = {
    sender: {
      email: "shop24963@gmail.com", // must be verified in Brevo
      name: "FinWiz Notifications"
    },
    to: Array.isArray(to)
      ? to.map((email) => ({ email }))
      : [{ email: to }],
    subject,
    textContent: text,
    htmlContent: html || `<p>${text}</p>`,
  };

  if (attachments.length > 0) {
    payload.attachment = attachments.map((file) => ({
      name: file.name,
      content: file.content,
      contentType: file.contentType || "application/octet-stream"
    }));
  }

  try {

    const response = await axios.post(BREVO_URL, payload, {
      headers: {
        "api-key": API_KEY,
        "content-type": "application/json"
      },
      timeout: 15000
    });

    return response.data;

  } catch (err) {

    console.error("Brevo Email Error:", {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message
    });

    throw new Error(
      err.response?.data?.message || "Email sending failed"
    );
  }
}