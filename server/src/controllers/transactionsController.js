// src/controllers/transactionsController.js
import Joi from "joi";
import moment from "moment";
import csv from "csvtojson";

import Transaction from "../models/Transaction.js";
import asyncHandler from "../middlewares/asyncHandler.js";
import { categorizeTransaction } from "../utils/categorizer.js";

/**
 * Validation schemas
 */
const createSchema = Joi.object({
  kind: Joi.string().valid("income", "expense").required(),
  amount: Joi.number().positive().required(),
  category: Joi.string().optional(),
  merchant: Joi.string().allow("").optional(),
  note: Joi.string().allow("").optional(),
  date: Joi.date().iso().required()
});

const updateSchema = Joi.object({
  kind: Joi.string().valid("income", "expense").optional(),
  amount: Joi.number().positive().optional(),
  category: Joi.string().optional(),
  merchant: Joi.string().allow("").optional(),
  note: Joi.string().allow("").optional(),
  date: Joi.date().iso().optional()
});

/**
 * POST /transactions
 */
export const createTransaction = asyncHandler(async (req, res) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  let category = value.category;
  let confidence = 0;

  if (!category || category === "Uncategorized") {
    const catRes = categorizeTransaction({
      merchant: value.merchant,
      note: value.note
    });
    category = catRes.category;
    confidence = catRes.confidence;
  }

  const tx = new Transaction({
    ...value,
    date: new Date(value.date),
    createdBy: req.user._id,
    metadata: { autoCategoryConfidence: confidence }
  });

  await tx.save();
  res.status(201).json({ message: "Transaction created", transaction: tx });
});

/**
 * GET /transactions
 */
export const getTransactions = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    kind,
    category,
    merchant,
    page = 1,
    limit = 25,
    sortBy = "-date"
  } = req.query;

  const filters = { createdBy: req.user._id };

  if (kind) filters.kind = kind;
  if (category) filters.category = category;
  if (merchant) filters.merchant = { $regex: merchant, $options: "i" };
  if (startDate || endDate) {
    filters.date = {};
    if (startDate) filters.date.$gte = new Date(startDate);
    if (endDate) filters.date.$lte = new Date(endDate);
  }

  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const docs = await Transaction.find(filters)
    .sort(sortBy)
    .skip(skip)
    .limit(Number(limit));

  const total = await Transaction.countDocuments(filters);

  res.json({
    meta: { total, page: Number(page), limit: Number(limit) },
    transactions: docs
  });
});

/**
 * PUT /transactions/:id
 */
export const updateTransaction = asyncHandler(async (req, res) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const tx = await Transaction.findOne({
    _id: req.params.id,
    createdBy: req.user._id
  });

  if (!tx) return res.status(404).json({ message: "Transaction not found" });

  Object.assign(tx, value);

  if ((value.merchant || value.note) && !value.category) {
    const catRes = categorizeTransaction({
      merchant: tx.merchant,
      note: tx.note
    });
    tx.category = catRes.category;
    tx.metadata = {
      ...tx.metadata,
      autoCategoryConfidence: catRes.confidence
    };
  }

  await tx.save();
  res.json({ message: "Transaction updated", transaction: tx });
});

/**
 * DELETE /transactions/:id
 */
export const deleteTransaction = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOneAndDelete({
    _id: req.params.id,
    createdBy: req.user._id
  });

  if (!tx) return res.status(404).json({ message: "Transaction not found" });

  res.json({ message: "Transaction deleted" });
});

/**
 * POST /transactions/upload-csv
 * BANK-SAFE CSV UPLOAD (Debit / Credit)
 */
export const uploadCsv = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "CSV file is required" });
  }

  const text = req.file.buffer.toString("utf8");
  const rows = await csv({ trim: true, ignoreEmpty: true }).fromString(text);

  const created = [];
  const errors = [];

  for (const [idx, row] of rows.entries()) {
    try {
      const rawDate =
        row.date ||
        row.Date ||
        row["Transaction Date"] ||
        row.transaction_date;

      if (!rawDate) throw new Error("missing date");

      const parsedDate = moment(
        rawDate,
        [
          moment.ISO_8601,
          "DD-MM-YYYY",
          "MM-DD-YYYY",
          "DD/MM/YYYY",
          "MM/DD/YYYY",
          "YYYY-MM-DD"
        ],
        true
      ).isValid()
        ? moment(rawDate).toDate()
        : null;

      if (!parsedDate) throw new Error("invalid date");

      // ✅ Debit / Credit logic
      const debit = Number(
        String(row.Debit || row.debit || "").replace(/[^0-9.-]+/g, "")
      );
      const credit = Number(
        String(row.Credit || row.credit || "").replace(/[^0-9.-]+/g, "")
      );

      let amount;
      let kind;

      if (debit && debit > 0) {
        amount = debit;
        kind = "expense";
      } else if (credit && credit > 0) {
        amount = credit;
        kind = "income";
      } else {
        const rawAmount = Number(
          String(
            row.amount ||
              row.Amount ||
              row.value ||
              row.TransactionAmount ||
              "0"
          ).replace(/[^0-9.-]+/g, "")
        );

        if (isNaN(rawAmount)) throw new Error("invalid amount");

        if (rawAmount < 0) {
          amount = Math.abs(rawAmount);
          kind = "income";
        } else {
          amount = rawAmount;
          kind = "expense";
        }
      }

      const merchant =
        row.merchant ||
        row.Merchant ||
        row.payee ||
        row.description ||
        row.Description ||
        "";

      const note = row.note || row.Note || "";

      const catRes = categorizeTransaction({ merchant, note });

      const tx = new Transaction({
        kind,
        amount,
        category: catRes.category,
        merchant,
        note,
        date: parsedDate,
        createdBy: req.user._id,
        metadata: {
          uploadedRowIndex: idx,
          rawRow: row,
          autoCategoryConfidence: catRes.confidence
        }
      });

      await tx.save();
      created.push(tx);
    } catch (err) {
      errors.push({
        row: idx + 1,
        reason: err.message || "unknown error"
      });
    }
  }

  res.json({
    message: "CSV processed",
    createdCount: created.length,
    errors,
    createdSample: created.slice(0, 5)
  });
});

/**
 * GET /transactions/summary
 */
export const getSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const start = startDate
    ? new Date(startDate)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const end = endDate ? new Date(endDate) : new Date();

  const agg = await Transaction.aggregate([
    { $match: { createdBy: req.user._id, date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: "$kind",
        total: { $sum: "$amount" },
        count: { $sum: 1 }
      }
    }
  ]);

  const result = { income: 0, expense: 0, counts: {} };

  for (const r of agg) {
    result[r._id] = r.total;
    result.counts[r._id] = r.count;
  }

  res.json({ start, end, summary: result });
});
