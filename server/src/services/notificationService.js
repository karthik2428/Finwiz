// src/services/notificationService.js

import Notification from "../models/Notification.js";
import { sendBrevoEmail } from "./brevoService.js";

/**
 * Create in-app notification
 */
export async function createNotification(
  userId,
  { title, message, type = "system", metadata = {} }
) {
  const note = new Notification({
    user: userId,
    title,
    message,
    type,
    metadata,
  });

  await note.save();
  return note;
}

/**
 * Push notification + email (if enabled)
 */
export async function notifyUser(user, options) {
  const note = await createNotification(user._id, options);

  // Send email only if enabled and email exists
  if (user.emailNotifications !== false && user.email) {
    try {
      await sendBrevoEmail({
        to: user.email,
        subject: options.title,
        text: `${options.message}\n\nFinWiz`,
      });
    } catch (err) {
      console.error("Email sending failed:", err.message);
      // Do NOT break login/signup if email fails
    }
  }

  return note;
}