// src/routes/transactionsRoutes.js
import express from "express";
import multer from "multer";
import {
  createTransaction, getTransactions, updateTransaction,
  deleteTransaction, uploadCsv, getSummary
} from "../controllers/transactionsController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

router.use(protect);

router.post("/", createTransaction);
router.get("/", getTransactions);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

router.post("/upload-csv", upload.single("file"), uploadCsv);

router.get("/summary", getSummary);

export default router;
