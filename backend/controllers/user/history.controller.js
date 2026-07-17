const History = require("../../models/history.model");

//mongoose
const mongoose = require("mongoose");

//get coin history
exports.getCoinWalletRecords = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Access denied. Invalid authentication token." });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDateObj,
          $lte: endDateObj,
        },
      };
    }

    const [transactionHistory] = await Promise.all([
      History.aggregate([
        {
          $match: {
            ...dateFilterQuery,
            type: { $nin: [7] },
            userId: userId,
            userCoin: { $gt: 0 },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: "listeners",
            localField: "listenerId",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  _id: 0,
                  name: 1,
                  image: 1,
                },
              },
            ],
            as: "listener",
          },
        },
        { $unwind: { path: "$listener", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            uniqueId: 1,
            type: 1,
            userCoin: 1,
            duration: 1,
            date: 1,
            createdAt: 1,
            receiverName: { $ifNull: ["$listener.name", ""] },
            receiverImage: { $ifNull: ["$listener.image", ""] },
            isIncome: {
              $cond: {
                if: { $in: ["$type", [1, 2, 8]] },
                then: true,
                else: {
                  $cond: {
                    if: {
                      $in: ["$type", [3, 4, 5, 6, 9]],
                    },
                    then: false,
                    else: false,
                  },
                },
              },
            },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      status: true,
      message: "Transaction history fetch successfully.",
      data: transactionHistory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Something went wrong. Please try again later." });
  }
};

//get call history
exports.getCallRecords = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Access denied. Invalid authentication token." });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDateObj,
          $lte: endDateObj,
        },
      };
    }

    const [transactionHistory] = await Promise.all([
      History.aggregate([
        {
          $match: {
            ...dateFilterQuery,
            type: { $in: [3, 4, 5, 6] },
            userId: userId,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: "listeners",
            localField: "listenerId",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  _id: 0,
                  name: 1,
                  image: 1,
                  ratePrivateVideoCall: 1,
                  ratePrivateAudioCall: 1,
                  video: 1,
                  audio: 1,
                  isFake: 1,
                  isAvailableForPrivateAudioCall: 1,
                  isAvailableForPrivateVideoCall: 1,
                  isAvailableForRandomAudioCall: 1,
                  isAvailableForRandomVideoCall: 1,
                  isAvailableForChat: 1,
                  isOnline: 1,
                  isBusy: 1,
                  callId: 1,
                },
              },
            ],
            as: "listener",
          },
        },
        { $unwind: { path: "$listener", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            isOnCall: {
              $and: [
                { $eq: ["$listener.isOnline", true] },
                { $eq: ["$listener.isBusy", true] },
                { $ne: ["$listener.callId", null] }
              ]
            },
            callStatusText: {
              $cond: [
                { $eq: ["$callConnect", false] },
                "Missed Call",
                {
                  $cond: [{ $eq: ["$callerRole", "user"] }, "Outgoing Call", "Incoming Call"],
                },
              ],
            },
          },
        },
        {
          $project: {
            _id: 1,
            duration: 1,
            date: 1,
            createdAt: 1,
            callStatusText: 1,
            listenerId: 1,
            isOnCall: 1,
            name: { $ifNull: ["$listener.name", ""] },
            image: { $ifNull: ["$listener.image", ""] },
            ratePrivateVideoCall: { $ifNull: ["$listener.ratePrivateVideoCall", 0] },
            ratePrivateAudioCall: { $ifNull: ["$listener.ratePrivateAudioCall", 0] },
            video: { $ifNull: ["$listener.video", []] },
            isFake: { $ifNull: ["$listener.isFake", false] },
            coin: "$listenerCoin",
            isAvailableForPrivateAudioCall: "$listener.isAvailableForPrivateAudioCall",
            isAvailableForPrivateVideoCall: "$listener.isAvailableForPrivateVideoCall",
            isAvailableForRandomAudioCall: "$listener.isAvailableForRandomAudioCall",
            isAvailableForRandomVideoCall: "$listener.isAvailableForRandomVideoCall",
            isAvailableForChat: "$listener.isAvailableForChat",
            audio: "$listener.audio",
            isOnline: "$listener.isOnline",
          },
        },
      ]),
    ]);

    return res.status(200).json({
      status: true,
      message: "Transaction history fetch successfully.",
      data: transactionHistory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Something went wrong. Please try again later." });
  }
};

//get purchase coinplan history
exports.getCoinPackagePurchaseHistory = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Access denied. Invalid authentication token." });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const startDate = req.query.startDate || "All";
    const endDate = req.query.endDate || "All";

    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;

    let dateFilterQuery = {};
    if (startDate !== "All" && endDate !== "All") {
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);

      dateFilterQuery = {
        createdAt: {
          $gte: startDateObj,
          $lte: endDateObj,
        },
      };
    }

    const [transactionHistory] = await Promise.all([
      History.aggregate([
        {
          $match: {
            ...dateFilterQuery,
            type: 2,
            userId: userId,
            userCoin: { $gt: 0 },
            price: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 1,
            uniqueId: 1,
            userCoin: 1,
            price: 1,
            paymentGateway: 1,
            date: 1,
            createdAt: 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
      ]),
    ]);

    return res.status(200).json({
      status: true,
      message: "Transaction history fetch successfully.",
      data: transactionHistory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Something went wrong. Please try again later." });
  }
};
