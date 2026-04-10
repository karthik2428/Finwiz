import mongoose from "mongoose";

const FundMetadataSchema = new mongoose.Schema({
  schemeCode: {
    type: String,
    unique: true,
    required: true,
    index: true
  },

  schemeName: {
    type: String,
    required: true,
    index: true
  },

  approved: {
    type: Boolean,
    default: true,
    index: true
  },

  categoryOverride: {
    type: String,
    enum: [
      "liquid",
      "ultra_short",
      "short_term",
      "corporate_bond",
      "index",
      "bluechip",
      "large_cap",
      "mid_cap",
      "small_cap",
      "flexi_cap",
      "multi_cap",
      "hybrid",
      "other"
    ],
    default: null,
    index: true
  },

  /* ================= PERFORMANCE METRICS ================= */

  // Multi-year CAGR
  cagr1y: {
    type: Number,
    default: 0,
    index: true
  },

  cagr3y: {
    type: Number,
    default: 0,
    index: true
  },

  cagr5y: {
    type: Number,
    default: 0,
    index: true
  },

  // Annualized volatility (1 year)
  volatility1y: {
    type: Number,
    default: 0,
    index: true
  },

  // Sharpe ratio (risk-adjusted return)
  sharpeRatio: {
    type: Number,
    default: 0,
    index: true
  },

  // Final smart ranking score
  smartScore: {
    type: Number,
    default: 0,
    index: true
  },

  lastNavComputed: {
    type: Date,
    default: null,
    index: true
  },

  notes: {
    type: String,
    default: ""
  }

}, {
  timestamps: true
});

/* ================= INDEXES FOR FAST RECOMMENDATION ================= */

// Used for filtering + ranking
FundMetadataSchema.index({
  approved: 1,
  categoryOverride: 1,
  smartScore: -1
});

// Used for analytics sorting
FundMetadataSchema.index({ sharpeRatio: -1 });

export default mongoose.model("FundMetadata", FundMetadataSchema);