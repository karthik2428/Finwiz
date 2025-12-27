// src/controllers/adminFundController.js
import asyncHandler from "../middlewares/asyncHandler.js";
import FundMetadata from "../models/FundMetadata.js";

const ensureAdmin = (req) => {
  if (req.user.role !== "admin") throw new Error("Admin only");
};

/**
 * GET /admin/funds
 */
export const listFunds = asyncHandler(async (req, res) => {
  ensureAdmin(req);

  const funds = await FundMetadata.find({}).sort({ schemeName: 1 });
  res.json({ funds });
});

/**
 * PUT /admin/funds/:schemeCode
 */
export const updateFund = asyncHandler(async (req, res) => {
  ensureAdmin(req);

  const { schemeCode } = req.params;

  let fund = await FundMetadata.findOne({ schemeCode });
  if (!fund) {
    fund = new FundMetadata({ schemeCode, schemeName: req.body.schemeName || "Unknown" });
  }

  if (req.body.approved !== undefined) fund.approved = req.body.approved;
  if (req.body.categoryOverride !== undefined) fund.categoryOverride = req.body.categoryOverride;
  if (req.body.notes !== undefined) fund.notes = req.body.notes;

  fund.lastUpdated = new Date();
  await fund.save();

  res.json({ message: "Fund updated", fund });
});
