// src/controllers/adminUserController.js
import asyncHandler from "../middlewares/asyncHandler.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";

const ensureAdmin = (req) => {
  if (req.user.role !== "admin") throw new Error("Admin only");
};

/**
 * GET /admin/users
 */
export const listUsers = asyncHandler(async (req, res) => {
  ensureAdmin(req);

  const users = await User.find({})
    .select("-password")
    .sort({ createdAt: -1 });

  res.json({ users });
});

/**
 * PUT /admin/users/:id/block
 */
export const blockUser = asyncHandler(async (req, res) => {
  ensureAdmin(req);

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.isBlocked = true;
  await user.save();

  res.json({ message: "User blocked" });
});

/**
 * PUT /admin/users/:id/unblock
 */
export const unblockUser = asyncHandler(async (req, res) => {
  ensureAdmin(req);

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.isBlocked = false;
  await user.save();

  res.json({ message: "User unblocked" });
});

/**
 * PUT /admin/users/:id/premium-activate
 */
export const activatePremium = asyncHandler(async (req, res) => {
  ensureAdmin(req);

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const now = new Date();
  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + 30);

  user.premium = {
    isActive: true,
    startDate: now,
    expiryDate: expiry,
    plan: "admin"
  };

  await user.save();
  res.json({ message: "Premium activated manually" });
});

/**
 * PUT /admin/users/:id/premium-deactivate
 */
export const deactivatePremium = asyncHandler(async (req, res) => {
  ensureAdmin(req);

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.premium.isActive = false;
  await user.save();

  res.json({ message: "Premium deactivated" });
});

/**
 * GET /admin/users/:id/payments
 */
export const getUserPayments = asyncHandler(async (req, res) => {
  ensureAdmin(req);

  const logs = await Payment.find({ user: req.params.id }).sort({ createdAt: -1 });
  res.json({ payments: logs });
});
