const mongoose = require("mongoose");

const reportReasonSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("ReportReason", reportReasonSchema);
