// src/controllers/notificationController.js
import Notification from "../models/Notification.js";
import asyncHandler from "../middlewares/asyncHandler.js";

/**
 * GET /notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {

  const notes = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(200);

  const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

  res.json({ data: notes, unreadCount });
});

/**
 * PUT /notifications/:id/read
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const note = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!note) return res.status(404).json({ message: "Notification not found" });

  note.read = true;
  await note.save();

  res.json({ message: "Marked as read" });
});
