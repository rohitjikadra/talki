const Block = require("../../models/block.model");

const mongoose = require("mongoose");

//get blocked listeners for a user
exports.listBlockedListenersForUser = async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(200).json({ status: false, message: "userId must be required." });
    }

    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const userId = new mongoose.Types.ObjectId(req.query.userId);
    const search = req?.query?.search || "";

    const result = await Block.aggregate([
      {
        $match: {
          isUserBlocked: true,
          userId,
        },
      },
      {
        $lookup: {
          from: "listeners",
          localField: "listenerId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
                image: 1,
                uniqueId: 1,
                coin: 1,
                country: 1,
                countryFlagImage: 1,
              },
            },
            ...(search
              ? [
                  {
                    $match: {
                      $or: [{ name: { $regex: search, $options: "i" } }, { uniqueId: { $regex: search, $options: "i" } }, { country: { $regex: search, $options: "i" } }],
                    },
                  },
                ]
              : []),
          ],
          as: "listener",
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
                listenerId: "$listener._id",
                name: "$listener.name",
                image: "$listener.image",
                uniqueId: "$listener.uniqueId",
                coin: "$listener.coin",
                country: "$listener.country",
                countryFlagImage: "$listener.countryFlagImage",
                createdAt: 1,
              },
            },
          ],
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Blocked listeners retrieved successfully.",
      total: result[0]?.total[0]?.count || 0,
      blockedListeners: result[0]?.data || [],
    });
  } catch (error) {
    console.error(error);
    returnres.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

//get blocked users for a listener
exports.listBlockedUsersForListener = async (req, res) => {
  try {
    if (!req.query.listenerId) {
      return res.status(200).json({ status: false, message: "listenerId is required." });
    }

    const start = parseInt(req.query.start) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const listenerId = new mongoose.Types.ObjectId(req.query.listenerId);
    const search = req?.query?.search || "";

    const result = await Block.aggregate([
      {
        $match: {
          isListenerBlocked: true,
          listenerId,
        },
      },
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
                uniqueId: 1,
                coin: 1,
                country: 1,
                countryFlag: 1,
              },
            },
            ...(search
              ? [
                  {
                    $match: {
                      $or: [
                        { nickName: { $regex: search, $options: "i" } },
                        { fullName: { $regex: search, $options: "i" } },
                        { uniqueId: { $regex: search, $options: "i" } },
                        { country: { $regex: search, $options: "i" } },
                      ],
                    },
                  },
                ]
              : []),
          ],
          as: "user",
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
                userId: "$user._id",
                nickName: "$user.nickName",
                fullName: "$user.fullName",
                profilePic: "$user.profilePic",
                uniqueId: "$user.uniqueId",
                coin: "$user.coin",
                country: "$user.country",
                countryFlagImage: "$user.countryFlag",
                createdAt: 1,
              },
            },
          ],
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: "Blocked users retrieved successfully.",
      total: result[0]?.total[0]?.count || 0,
      blockedUsers: result[0]?.data || [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
