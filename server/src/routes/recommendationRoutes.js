// src/routes/recommendationRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import { recommendFunds } from "../controllers/recommendationController.js";

const router = express.Router();

router.use(protect);

router.get("/mutual-funds", recommendFunds);

export default router;
