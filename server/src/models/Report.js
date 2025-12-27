// src/models/Report.js
import mongoose from "mongoose";

/**
 * Report model - tracks generated reports
 */
const ReportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  month: { type: String, required: true }, // "YYYY-MM"
  filePath: { type: String, required: true },
  fileName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model("Report", ReportSchema);
export default Report;
