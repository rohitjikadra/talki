const Block = require("../../models/block.model");

//import model
const User = require("../../models/user.model");
const Listener = require("../../models/listener.model");

//mongoose
const mongoose = require("mongoose");

//handle listener blocking a user
exports.blockUser = async (req, res) => {
  try {
    const { listenerId, userId } = req.query;

    if (!listenerId || !userId) {
      return res.status(200).json({ status: false, message: "listenerId and userId are required." });
    }

    if (!mongoose.Types.ObjectId.isValid(listenerId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(200).json({ status: false, message: "Invalid listenerId or userId." });
    }

    const lId = new mongoose.Types.ObjectId(listenerId);
    const uId = new mongoose.Types.ObjectId(userId);

    const [listener, user, block] = await Promise.all([
      Listener.findById(lId).select("_id").lean(),
      User.findById(uId).select("_id").lean(),
      Block.findOne({ userId: uId, listenerId: lId }).lean(),
    ]);

    if (!listener) return res.status(200).json({ status: false, message: "Listener not found." });
    if (!user) return res.status(200).json({ status: false, message: "User not found." });

    const isCurrentlyBlocked = block?.isListenerBlocked === true;

    const updatedBlock = await Block.findOneAndUpdate(
      { userId: uId, listenerId: lId },
      {
        $set: {
          isListenerBlocked: !isCurrentlyBlocked,
        },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      status: true,
      message: updatedBlock.isListenerBlocked
        ? "User blocked successfully."
        : "User unblocked successfully.",
      isBlocked: updatedBlock.isListenerBlocked,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

//get blocked users for a listener
exports.getBlockedUsersForListener = async (req, res) => {
  try {
    const { listenerId, search } = req.query || {};

    if (!listenerId) {
      return res.status(200).json({ status: false, message: "listenerId is required." });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const pipeline = [
      {
        $match: {
          listenerId: new mongoose.Types.ObjectId(listenerId),
          isListenerBlocked: true
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
          pipeline: [
            {
              $project: {
                fullName: 1,
                nickName: 1,
                uniqueId: 1,
                profilePic: 1,
                country: 1,
              },
            },
            ...(search
              ? [
                {
                  $match: {
                    $or: [
                      { fullName: { $regex: search, $options: "i" } },
                      { nickName: { $regex: search, $options: "i" } },
                      { uniqueId: { $regex: search, $options: "i" } },
                      { country: { $regex: search, $options: "i" } },
                    ],
                  },
                },
              ]
              : []),
          ],
        },
      },
      { $unwind: "$user" },
      {
        $facet: {
          total: [{ $count: "count" }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: (start - 1) * limit },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                createdAt: 1,
                user: 1,
              },
            },
          ],
        },
      },
    ];

    const result = await Block.aggregate(pipeline);

    const blockedUsers = result[0]?.data || [];
    const total = result[0]?.total[0]?.count || 0;

    return res.status(200).json({
      status: true,
      message: blockedUsers.length > 0 ? "Blocked users retrieved successfully." : "No blocked users found.",
      total,
      blockedUsers,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
