const { default: mongoose } = require("mongoose");
const Report = require("../../models/report.model");
const User = require("../../models/user.model");

const admin = require("../../util/privateKey");

// Get all user-listener reports
exports.getUserListenerReports = async (req, res) => {
  try {
    const { reporterId, targetId, status, targetRole, search, startDate, endDate } = req.query;
    const page = parseInt(req.query.start) || 1;
    const pageSize = parseInt(req.query.limit) || 20;
    const trimmedSearch = search ? search.trim() : null;

    const matchStage = {};
    if (reporterId && mongoose.Types.ObjectId.isValid(reporterId)) matchStage.reporterId = mongoose.Types.ObjectId(reporterId);
    if (targetId && mongoose.Types.ObjectId.isValid(targetId)) matchStage.targetId = mongoose.Types.ObjectId(targetId);
    if (status && status !== "All") matchStage.status = parseInt(status);
    if (targetRole && targetRole !== "All") matchStage.targetRole = targetRole;

    let dateFilter = {};
    if (startDate && endDate && startDate !== "All" && endDate !== "All") {
      const from = new Date(startDate);
      const to = new Date(endDate);
      to.setHours(23, 59, 59, 999);

      dateFilter.proceedAt = { $gte: from, $lte: to };
    }

    const pipeline = [
      { $match: { ...matchStage, ...dateFilter } },

      // Reporter User
      {
        $lookup: {
          from: "users",
          localField: "reporterId",
          foreignField: "_id",
          pipeline: [{ $project: { _id: 1, name: 1, uniqueId: 1, image: 1 } }],
          as: "reporterUser",
        },
      },
      { $unwind: { path: "$reporterUser", preserveNullAndEmptyArrays: true } },

      // Reporter listener
      {
        $lookup: {
          from: "listeners",
          localField: "reporterId",
          foreignField: "_id",
          pipeline: [{ $project: { _id: 1, name: 1, uniqueId: 1, image: 1 } }],
          as: "reporterListener",
        },
      },
      { $unwind: { path: "$reporterListener", preserveNullAndEmptyArrays: true } },

      // Target User
      {
        $lookup: {
          from: "users",
          localField: "targetId",
          foreignField: "_id",
          pipeline: [{ $project: { _id: 1, name: 1, uniqueId: 1, image: 1 } }],
          as: "targetUser",
        },
      },
      { $unwind: { path: "$targetUser", preserveNullAndEmptyArrays: true } },

      // Target listener
      {
        $lookup: {
          from: "listeners",
          localField: "targetId",
          foreignField: "_id",
          pipeline: [{ $project: { _id: 1, name: 1, uniqueId: 1, image: 1 } }],
          as: "targetListener",
        },
      },
      { $unwind: { path: "$targetListener", preserveNullAndEmptyArrays: true } },
    ];

    // Search filter
    if (trimmedSearch) {
      pipeline.push({
        $match: {
          $or: [
            { "reporterUser.name": { $regex: trimmedSearch, $options: "i" } },
            { "reporterUser.uniqueId": { $regex: trimmedSearch, $options: "i" } },
            { "reporterListener.name": { $regex: trimmedSearch, $options: "i" } },
            { "reporterListener.uniqueId": { $regex: trimmedSearch, $options: "i" } },
            { "targetUser.name": { $regex: trimmedSearch, $options: "i" } },
            { "targetUser.uniqueId": { $regex: trimmedSearch, $options: "i" } },
            { "targetListener.name": { $regex: trimmedSearch, $options: "i" } },
            { "targetListener.uniqueId": { $regex: trimmedSearch, $options: "i" } },
          ],
        },
      });
    }

    pipeline.push({ $sort: { createdAt: -1 } });

    pipeline.push({
      $facet: {
        data: [
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          {
            $project: {
              reporterId: 1,
              reporterRole: 1,
              targetId: 1,
              targetRole: 1,
              reason: 1,
              status: 1,
              proceedAt: 1,
              createdAt: 1,
              updatedAt: 1,
              reporterName: { $ifNull: ["$reporterUser.name", "$reporterListener.name"] },
              reporterUniqueId: { $ifNull: ["$reporterUser.uniqueId", "$reporterListener.uniqueId"] },
              reporterImage: { $ifNull: ["$reporterUser.image", "$reporterListener.image"] },
              targetName: { $ifNull: ["$targetUser.name", "$targetListener.name"] },
              targetUniqueId: { $ifNull: ["$targetUser.uniqueId", "$targetListener.uniqueId"] },
              targetImage: { $ifNull: ["$targetUser.image", "$targetListener.image"] },
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    });

    const result = await Report.aggregate(pipeline);
    const total = result[0].totalCount[0] ? result[0].totalCount[0].count : 0;
    const reports = result[0].data;

    return res.status(200).json({
      status: true,
      message: "User-Listener reports retrieved successfully.",
      total,
      data: reports,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// Solve a report
exports.solveUserListenerReport = async (req, res) => {
  try {
    const { reportId } = req.query;
    if (!reportId) {
      return res.status(200).json({ status: false, message: "reportId is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(200).json({ status: false, message: "Invalid reportId." });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(200).json({ status: false, message: "Report not found." });
    }

    if (report.status === 2) return res.status(200).json({ status: false, message: "Report is already solved." });

    report.status = 2;
    report.proceedAt = new Date();
    await report.save();

    res.status(200).json({
      status: true,
      message: "Report marked as solved.",
      data: report,
    });

    if (report.reporterId) {
      const reporter = await User.findById(report.reporterId).lean().select("fcmToken name");
      if (reporter?.fcmToken !== null) {
        const payload = {
          token: reporter?.fcmToken,
          data: {
            title: "Your report has been solved",
            body: `Hi ${reporter.name}, the report you submitted has been resolved.`,
            type: "REPORT_SOLVED",
          },
        };

        const adminPromise = await admin;
        adminPromise
          .messaging()
          .send(payload)
          .then((response) => {
            console.log("Successfully sent with response solveUserListenerReport: ", response);
          })
          .catch((error) => {
            console.error("Error sending FCM message:", error);
          });
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal Server Error." });
  }
};

// Delete a report
exports.deleteUserListenerReport = async (req, res) => {
  try {
    const { reportId } = req.query || {};
    if (!reportId) {
      return res.status(200).json({ status: false, message: "reportId is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(200).json({ status: false, message: "Invalid reportId." });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(200).json({ status: false, message: "Report not found." });
    }

    await report.deleteOne();

    return res.status(200).json({ status: true, message: "Report deleted successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal Server Error." });
  }
};
