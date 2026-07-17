const Report = require("../../models/report.model");
const User = require("../../models/user.model");
const Listener = require("../../models/listener.model");

const admin = require("../../util/privateKey");
const mongoose = require("mongoose");

// Submit a report (user → host or host → user)
exports.submitReport = async (req, res) => {
  try {
    const { reporterId, reporterRole, targetId, targetRole, reason } = req.body;

    if (!reporterId || !reporterRole || !targetId || !targetRole || !reason) {
      return res.status(200).json({ status: false, message: "All fields are required." });
    }

    if (!["user", "listener"].includes(reporterRole) || !["user", "listener"].includes(targetRole)) {
      return res.status(200).json({ status: false, message: "Invalid reporterRole or targetRole." });
    }

    if (reporterId === targetId && reporterRole === targetRole) {
      return res.status(200).json({ status: false, message: "You cannot report yourself." });
    }

    if (!mongoose.Types.ObjectId.isValid(reporterId) || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(200).json({ status: false, message: "Invalid reporterId or targetId." });
    }

    const reporterModel = reporterRole === "user" ? User : Listener;
    const targetModel = targetRole === "user" ? User : Listener;

    const [reporter, target] = await Promise.all([reporterModel.findById(reporterId).select("_id isBlock fcmToken name").lean(), targetModel.findById(targetId).select("_id isBlock name").lean()]);

    if (!reporter) {
      console.error("Reporter not found.");
      return res.status(200).json({ status: false, message: "Reporter not found." });
    }

    if (reporter.isBlock) {
      console.error("Reporter is blocked by admin.");
      return res.status(200).json({ status: false, message: "You are blocked by admin." });
    }

    if (!target) {
      console.error("Target not found.");
      return res.status(200).json({ status: false, message: "Target not found." });
    }

    if (target.isBlock) {
      console.error("Target is blocked.");
      return res.status(200).json({ status: false, message: "Target is blocked." });
    }

    const existingReport = await Report.findOne({
      reporterId,
      reporterRole,
      targetId,
      targetRole,
      status: 1, // pending
    }).lean();

    if (existingReport) {
      console.error("Report already submitted.");
      return res.status(200).json({
        status: false,
        message: `A report has already been submitted.`,
      });
    }

    res.status(200).json({
      status: true,
      message: "Report submitted successfully.",
    });

    const newReport = new Report({
      reporterId,
      reporterRole,
      targetId,
      targetRole,
      reason: reason.trim(),
    });
    await newReport.save();

    if (reporter.fcmToken) {
      const payload = {
        token: reporter.fcmToken,
        data: {
          title: "🚨 Report Submitted",
          body: "Your report has been successfully submitted and is under review.",
          type: "REPORT_SUBMISSION",
        },
      };

      const adminPromise = await admin;
      adminPromise.messaging().send(payload).catch(console.error);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal Server Error." });
  }
};
