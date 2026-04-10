// src/controllers/adminFundController.js
import asyncHandler from "../middlewares/asyncHandler.js";
import FundMetadata from "../models/FundMetadata.js";
import { fetchFundList } from "../services/mfService.js";
import { classifyFund } from "../utils/fundClassifier.js";

const ensureAdmin = (req) => {
  if (req.user.role !== "admin") throw new Error("Admin only");
};

/* ================================================== */
/* POST /admin/funds/sync                            */
/* Sync MFAPI funds into DB (WITH LIMIT SUPPORT)     */
/* ================================================== */
export const syncFundsFromMFAPI = asyncHandler(async (req, res) => {
  ensureAdmin(req);

  const { limit } = req.query; // 🔥 optional limit param

  const funds = await fetchFundList();

  if (!funds || !funds.length) {
    return res.status(400).json({ message: "MFAPI returned no funds" });
  }

  // 🔥 Apply limit if provided
  const limitedFunds = limit
    ? funds.slice(0, Number(limit))
    : funds;

  const bulkOps = limitedFunds.map((fund) => ({
    updateOne: {
      filter: { schemeCode: fund.schemeCode },
      update: {
        $set: {
          schemeName: fund.schemeName,
          approved: true,
          categoryOverride: classifyFund(fund.schemeName),
          lastUpdated: new Date(),
        },
      },
      upsert: true,
    },
  }));

  await FundMetadata.bulkWrite(bulkOps);

  res.json({
    message: "Funds synced successfully",
    totalSynced: limitedFunds.length,
  });
});

/* ================================================== */
/* GET /admin/funds                                  */
/* Paginated Fund Listing                            */
/* ================================================== */
export const listFunds = asyncHandler(async (req, res) => {
  ensureAdmin(req);

  const {
    approved,
    category,
    search,
    page = 1,
    limit = 15,
  } = req.query;

  // 🔥 Prevent abuse (max 100 per page)
  const safeLimit = Math.min(Number(limit), 100);
  const skip = (Number(page) - 1) * safeLimit;

  let filter = {};

  if (approved !== undefined && approved !== "") {
    filter.approved = approved === "true";
  }

  if (category) {
    filter.categoryOverride = category;
  }

  if (search) {
    filter.schemeName = { $regex: search, $options: "i" };
  }

  const funds = await FundMetadata.find(filter)
    .select("schemeName schemeCode approved categoryOverride lastUpdated") // 🔥 only required fields
    .sort({ schemeName: 1 })
    .skip(skip)
    .limit(safeLimit);

  const total = await FundMetadata.countDocuments(filter);

  res.json({
    funds,
    currentPage: Number(page),
    totalPages: Math.ceil(total / safeLimit),
    totalRecords: total,
  });
});

/* ================================================== */
/* PUT /admin/funds/:schemeCode                      */
/* Update Fund Metadata                              */
/* ================================================== */
export const updateFund = asyncHandler(async (req, res) => {
  ensureAdmin(req);

  const { schemeCode } = req.params;

  const fund = await FundMetadata.findOne({ schemeCode });

  if (!fund) {
    return res.status(404).json({ message: "Fund not found" });
  }

  if (req.body.approved !== undefined)
    fund.approved = req.body.approved;

  if (req.body.categoryOverride !== undefined)
    fund.categoryOverride = req.body.categoryOverride;

  if (req.body.notes !== undefined)
    fund.notes = req.body.notes;

  fund.lastUpdated = new Date();

  await fund.save();

  res.json({
    message: "Fund updated successfully",
    fund,
  });
});