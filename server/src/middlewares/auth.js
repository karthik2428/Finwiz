// src/middlewares/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    // Read token from cookie first
    const token =
      req.cookies?.token ||
      (req.header("Authorization")?.startsWith("Bearer ") &&
        req.header("Authorization").split(" ")[1]);

    if (!token) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    next(err); // 🔥 FIXED — Always forward errors to Express
  }
};
