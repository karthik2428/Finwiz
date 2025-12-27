export const PORTFOLIO_TEMPLATES = {
  CONSERVATIVE_SHORT: {
    name: "Capital Protection Portfolio",
    expectedReturn: 7,
    buckets: [
      { type: "liquid", weight: 40 },
      { type: "corporate_bond", weight: 40 },
      { type: "short_term", weight: 20 }
    ]
  },

  MODERATE_MEDIUM: {
    name: "Balanced Growth Portfolio",
    expectedReturn: 12,
    buckets: [
      { type: "large_cap", weight: 35 },
      { type: "hybrid", weight: 25 },
      { type: "mid_cap", weight: 25 },
      { type: "index", weight: 15 }
    ]
  },

  AGGRESSIVE_LONG: {
    name: "Growth Accelerator Portfolio",
    expectedReturn: 15,
    buckets: [
      { type: "large_cap", weight: 30 },
      { type: "flexi_cap", weight: 30 },
      { type: "mid_cap", weight: 25 },
      { type: "small_cap", weight: 15 }
    ]
  }
};
