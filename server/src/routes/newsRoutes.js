// src/routes/newsRoutes.js
import express from "express";
import { protect } from "../middlewares/auth.js";
import { getNews } from "../controllers/newsController.js";

const router = express.Router();
router.use(protect);

router.get("/", getNews);

export default router;
