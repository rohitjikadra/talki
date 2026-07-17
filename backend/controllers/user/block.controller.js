const Block = require("../../models/block.model");

//import model
const User = require("../../models/user.model");
const Listener = require("../../models/listener.model");

//mongoose
const mongoose = require("mongoose");

//handle user blocking a listner
exports.blockListener = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized." });
    }

    const { listenerId } = req.query;
    if (!listenerId) {
      return res.status(200).json({ status: false, message: "listenerId is required." });
    }

    if (!mongoose.Types.ObjectId.isValid(listenerId)) {
      return res.status(200).json({ status: false, message: "Invalid listenerId." });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const lId = new mongoose.Types.ObjectId(listenerId);

    const [user, listener, block] = await Promise.all([
      User.findById(userId).select("_id").lean(),
      Listener.findById(lId).select("_id").lean(),
      Block.findOne({ userId, listenerId: lId }).lean(),
    ]);

    if (!user) return res.status(200).json({ status: false, message: "User not found." });
    if (!listener) return res.status(200).json({ status: false, message: "Listener not found." });

    const isCurrentlyBlocked = block?.isUserBlocked === true;

    const updatedBlock = await Block.findOneAndUpdate(
      { userId, listenerId: lId },
      {
        $set: {
          isUserBlocked: !isCurrentlyBlocked,
        },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      status: true,
      message: updatedBlock.isUserBlocked
        ? "Listener blocked successfully."
        : "Listener unblocked successfully.",
      isBlocked: updatedBlock.isUserBlocked,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

//get blocked listeners for a user
exports.getBlockedListenersForUser = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const { search } = req.query;

    const start = parseInt(req.query.start) > 0 ? parseInt(req.query.start) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 20;

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const pipeline = [
      {
        $match: {
          userId,
          isUserBlocked: true
        }
      },

      {
        $lookup: {
          from: "listeners",
          localField: "listenerId",
          foreignField: "_id",
          as: "listener",
          pipeline: [
            {
              $project: {
                name: 1,
                nickName: 1,
                uniqueId: 1,
                image: 1,
                country: 1,
              },
            },
            ...(search
              ? [
                {
                  $match: {
                    $or: [
                      { name: { $regex: search, $options: "i" } },
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
      { $unwind: "$listener" },
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
                listener: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
    ];

    const result = await Block.aggregate(pipeline);

    const blockedListeners = result[0]?.data || [];
    const total = result[0]?.total[0]?.count || 0;

    return res.status(200).json({
      status: true,
      message: blockedListeners.length > 0 ? "Blocked listeners retrieved successfully." : "No blocked listeners found.",
      total,
      blockedListeners,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
