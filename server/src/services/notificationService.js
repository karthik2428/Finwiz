// src/services/notificationService.js
import Notification from "../models/Notification.js";
import { sendBrevoEmail } from "./brevoService.js";

/**
 * Create in-app notification
 */
export async function createNotification(userId, { title, message, type = "system", metadata = {} }) {
  const note = new Notification({
    user: userId,
    title,
    message,
    type,
    metadata
  });
  await note.save();
  return note;
}

/**
 * Push notification + email (if enabled)
 */
export async function notifyUser(user, options) {
  const note = await createNotification(user._id, options);

  if (user.emailNotifications !== false) {
    await sendBrevoEmail(
      user.email,
      options.title,
      `${options.message}\n\nFinWiz`
    );
  }

  return note;
}
