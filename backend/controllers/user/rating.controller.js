const Rating = require("../../models/rating.model");

//import model
const Listener = require("../../models/listener.model");
const User = require("../../models/user.model");
const Notification = require("../../models/notification.model");

//mongoose
const mongoose = require("mongoose");

//private key
const admin = require("../../util/privateKey");

//dayjs
const dayjs = require("dayjs");

//rating listener ( after call )
exports.submitListenerReview = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const { rating, review, listenerId } = req.query;

    if (!rating || !listenerId) {
      return res.status(200).json({ status: false, message: "Missing required parameters: rating or listenerId." });
    }

    if (!mongoose.Types.ObjectId.isValid(listenerId)) {
      return res.status(200).json({ status: false, message: "Invalid listenerId." });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(200).json({ status: false, message: "Rating must be a number between 1 and 5." });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const listenerObjectId = new mongoose.Types.ObjectId(listenerId);

    const [sender, listenerData] = await Promise.all([
      User.findOne({ _id: userId }).select("fullName").lean(),
      Listener.findOne({ _id: listenerObjectId }).select("isBlock rating reviewCount isNotificationEnabled fcmToken").lean(),
    ]);

    if (!listenerData || listenerData.isBlock) {
      return res.status(200).json({ status: false, message: "Listener not found or is blocked." });
    }

    res.status(200).json({
      status: true,
      message: "Your review has been successfully recorded.",
    });

    const oldRating = typeof listenerData.rating === "number" ? listenerData.rating : 0;
    const oldCount = typeof listenerData.reviewCount === "number" ? listenerData.reviewCount : 0;
    const updatedRating = (oldRating * oldCount + numericRating) / (oldCount + 1);

    const newReview = new Rating({
      userId,
      listenerId: listenerObjectId,
      review: review || "",
      rating: numericRating,
    });

    await Promise.all([
      Listener.updateOne(
        { _id: listenerObjectId },
        {
          $set: { rating: updatedRating },
          $inc: { reviewCount: 1 },
        },
      ),
      newReview.save(),
    ]);

    if (listenerData?.isNotificationEnabled && !listenerData?.isBlock && listenerData?.fcmToken) {
      const hasRating = numericRating > 0;
      const notificationTitle = hasRating ? `⭐ ${sender?.fullName || "Someone"} rated your profile!` : `📝 ${sender?.fullName || "Someone"} shared feedback!`;
      const notificationBody = hasRating ? `They gave you a ${numericRating}⭐ review. See what they said!` : `You’ve received a new written review. Tap to read it.`;

      const payload = {
        token: listenerData.fcmToken,
        data: {
          title: notificationTitle,
          body: notificationBody,
          type: "REVIEW",
          senderId: String(sender?._id || ""),
          name: String(sender?.fullName || ""),
          profilePic: String(sender?.profilePic || ""),
          isOnline: String(sender?.isOnline || false),
        },
      };

      const adminPromise = await admin;
      adminPromise
        .messaging()
        .send(payload)
        .then(async (response) => {
          console.log("Successfully sent notification: ", response);

          const notification = new Notification();
          notification.listenerId = listenerObjectId;
          notification.title = notificationTitle;
          notification.message = notificationBody;
          notification.date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
          await notification.save();
        })
        .catch((error) => {
          console.error("Error sending review notification: ", error);
        });
    }
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
    }
  }
};

//get listener's reviews
exports.fetchListenerReviews = async (req, res, next) => {
  try {
    const { listenerId } = req.query;

    if (!listenerId || !mongoose.Types.ObjectId.isValid(listenerId)) {
      return res.status(200).json({ status: false, message: "Invalid listenerId." });
    }

    const now = new Date();
    const listenerObjectId = new mongoose.Types.ObjectId(listenerId);

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const [listenerData, reviews] = await Promise.all([
      Listener.findOne({ _id: listenerObjectId }).select("isBlock").lean(),
      Rating.aggregate([
        {
          $match: {
            listenerId: listenerObjectId,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (start - 1) * limit },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  nickName: 1,
                  fullName: 1,
                  profilePic: 1,
                  isOnline: 1,
                  isBusy: 1,
                  callId: 1,
                },
              },
            ],
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $addFields: {
            isOnCall: {
              $and: [
                { $eq: ["$userDetails.isOnline", true] },
                { $eq: ["$userDetails.isBusy", true] },
                { $ne: ["$userDetails.callId", null] }
              ]
            },
          }
        },
        {
          $project: {
            rating: 1,
            review: 1,
            nickName: "$userDetails.nickName",
            fullName: "$userDetails.fullName",
            profilePic: "$userDetails.profilePic",
            isOnCall: 1,
            time: {
              $let: {
                vars: {
                  diff: { $subtract: [now, "$createdAt"] },
                },
                in: {
                  $switch: {
                    branches: [
                      {
                        case: { $gte: ["$$diff", 31536000000] },
                        then: {
                          $concat: [{ $toString: { $floor: { $divide: ["$$diff", 31536000000] } } }, " years ago"],
                        },
                      },
                      {
                        case: { $gte: ["$$diff", 2592000000] },
                        then: {
                          $concat: [{ $toString: { $floor: { $divide: ["$$diff", 2592000000] } } }, " months ago"],
                        },
                      },
                      {
                        case: { $gte: ["$$diff", 86400000] },
                        then: {
                          $concat: [{ $toString: { $floor: { $divide: ["$$diff", 86400000] } } }, " days ago"],
                        },
                      },
                      {
                        case: { $gte: ["$$diff", 3600000] },
                        then: {
                          $concat: [{ $toString: { $floor: { $divide: ["$$diff", 3600000] } } }, " hours ago"],
                        },
                      },
                      {
                        case: { $gte: ["$$diff", 60000] },
                        then: {
                          $concat: [{ $toString: { $floor: { $divide: ["$$diff", 60000] } } }, " minutes ago"],
                        },
                      },
                      {
                        case: { $gte: ["$$diff", 1000] },
                        then: {
                          $concat: [{ $toString: { $floor: { $divide: ["$$diff", 1000] } } }, " seconds ago"],
                        },
                      },
                    ],
                    default: "Just now",
                  },
                },
              },
            },
          },
        },
      ]),
    ]);

    if (!listenerData || listenerData.isBlock) {
      return res.status(200).json({ status: false, message: "Listener not found or is blocked." });
    }

    return res.status(200).json({
      status: true,
      message: "Retrive agency's reviews successfully.",
      reviews: reviews,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
