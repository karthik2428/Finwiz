// src/controllers/authController.js
import jwt from "jsonwebtoken";
import Joi from "joi";
import User from "../models/User.js";
import asyncHandler from "../middlewares/asyncHandler.js";

/**
 * createTokenCookie - sets JWT in HttpOnly cookie
 */
const createTokenCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  res.cookie("token", token, cookieOptions);
};

// Validation schemas
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

// POST /auth/signup
export const signup = asyncHandler(async (req, res) => {
  const { error, value } = signupSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const exists = await User.findOne({ email: value.email });
  if (exists) return res.status(409).json({ message: "Email already in use" });

  const user = new User({
    name: value.name,
    email: value.email,
    password: value.password,
    age: value.age,
  });
  await user.save();

  createTokenCookie(res, user._id);
  /* 
     NOTE: Returning token in body for frontend localStorage (optional if strictly using cookies, 
     but client AuthContext relies on it). 
  */
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
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
      premium: user.premium
    }
  });
});

// POST /auth/login
export const login = asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const user = await User.findOne({ email: value.email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = await user.matchPassword(value.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  createTokenCookie(res, user._id);
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
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
      premium: user.premium
    }
  });
});

// POST /auth/logout
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" });
  res.json({ message: "Logged out" });
});
