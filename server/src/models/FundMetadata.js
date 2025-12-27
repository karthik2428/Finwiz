// src/models/FundMetadata.js
import mongoose from "mongoose";

const FundMetadataSchema = new mongoose.Schema({
  schemeCode: { type: String, unique: true, required: true },
  schemeName: { type: String, required: true },

  approved: { type: Boolean, default: true }, // admin can hide fund
  categoryOverride: { type: String, default: null }, // override classifier output
  notes: { type: String, default: "" }, // internal usage

  lastUpdated: { type: Date, default: Date.now }
});

const FundMetadata = mongoose.model("FundMetadata", FundMetadataSchema);
export default FundMetadata;
