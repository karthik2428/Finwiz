// src/controllers/authController.js
import jwt from "jsonwebtoken";
import Joi from "joi";
import User from "../models/User.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { notifyUser } from "../services/notificationService.js";
import Otp from "../models/Otp.js";
import { generateOTP } from "../utils/otpGenerator.js";
import { sendBrevoEmail } from "../services/brevoService.js";

/**
 * createTokenCookie - sets JWT in HttpOnly cookie
 */
const createTokenCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };

  res.cookie("token", token, cookieOptions);
};

/* -------------------- VALIDATION -------------------- */

const signupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  age: Joi.number().integer().min(10).max(120).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const forgotSchema = Joi.object({
  email: Joi.string().email().required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

/* -------------------- SIGNUP -------------------- */

export const signup = asyncHandler(async (req, res) => {
  const { error, value } = signupSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const exists = await User.findOne({ email: value.email });

  if (exists)
    return res.status(409).json({ message: "Email already in use" });

  const user = new User({
    name: value.name,
    email: value.email,
    password: value.password,
    age: value.age,
  });

  await user.save();

  await notifyUser(user, {
    title: "Welcome to FinWiz 🎉",
    message: "Your account has been created successfully.",
    type: "system",
  });

  createTokenCookie(res, user._id);

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  res.status(201).json({
    message: "User created",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      role: user.role,
      isPremium: user.isPremium,
      premium: user.premium,
    },
  });
});

/* -------------------- LOGIN -------------------- */

export const login = asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);

  if (error) return res.status(400).json({ message: error.message });

  const user = await User.findOne({ email: value.email });

  if (!user)
    return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = await user.matchPassword(value.password);

  if (!isMatch)
    return res.status(401).json({ message: "Invalid credentials" });

  await notifyUser(user, {
    title: "New Login Detected",
    message: `Login detected at ${new Date().toLocaleString()}`,
    type: "security",
  });

  createTokenCookie(res, user._id);

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  res.json({
    message: "Logged in",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      role: user.role,
      isPremium: user.isPremium,
      premium: user.premium,
    },
  });
});

/* -------------------- LOGOUT -------------------- */

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  res.json({ message: "Logged out" });
});

/* -------------------- FORGOT PASSWORD -------------------- */

export const forgotPassword = asyncHandler(async (req, res) => {
  const { error, value } = forgotSchema.validate(req.body);

  if (error) return res.status(400).json({ message: error.message });

  const user = await User.findOne({ email: value.email });

  if (!user)
    return res.status(404).json({ message: "User not found" });

  const otp = generateOTP();

  await Otp.create({
    email: value.email,
    otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendBrevoEmail({
    to: value.email,
    subject: "FinWiz Password Reset OTP",
    text: `Your OTP is ${otp}. Valid for 10 minutes.`,
  });

  res.json({ message: "OTP sent to email" });
});

/* -------------------- VERIFY OTP -------------------- */

export const verifyOtp = asyncHandler(async (req, res) => {
  const { error, value } = verifyOtpSchema.validate(req.body);

  if (error) return res.status(400).json({ message: error.message });

  const record = await Otp.findOne({
    email: value.email,
    otp: value.otp,
  });

  if (!record)
    return res.status(400).json({ message: "Invalid OTP" });

  if (record.expiresAt < new Date())
    return res.status(400).json({ message: "OTP expired" });

  res.json({ message: "OTP verified" });
});

/* -------------------- RESET PASSWORD -------------------- */

export const resetPassword = asyncHandler(async (req, res) => {
  const { error, value } = resetPasswordSchema.validate(req.body);

  if (error) return res.status(400).json({ message: error.message });

  const user = await User.findOne({ email: value.email });

  if (!user)
    return res.status(404).json({ message: "User not found" });

  // IMPORTANT: do NOT hash here
  // the User model pre-save middleware should hash it
  user.password = value.password;

  await user.save();

  await Otp.deleteMany({ email: value.email });

  res.json({ message: "Password reset successful" });
});