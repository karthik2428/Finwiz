// src/models/Notification.js
import mongoose from "mongoose";

/**
 * Notification Model
 *
 * Stored for in-app viewing.
 * Every notification may include:
 * - title
 * - message
 * - type: budget | subscription | goal | forecast | system
 * - read: boolean
 * - metadata: custom details
 */
const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["budget", "subscription", "goal", "forecast", "system"], default: "system" },
  read: { type: Boolean, default: false },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;
