const ChatTopic = require("../../models/chatTopic.model");
const Chat = require("../../models/chat.model");

const { deleteFile } = require("../../util/deletefile");

//import model
const User = require("../../models/user.model");

//mongoose
const mongoose = require("mongoose");

//search user (chat)
exports.searchChattedUsers = async (req, res) => {
  try {
    if (!req.query.listenerId || !mongoose.Types.ObjectId.isValid(req.query.listenerId)) {
      return res.status(200).json({ status: false, message: "Listener ID is missing or invalid." });
    }

    const searchString = req.query.searchString?.trim();
    if (!searchString) {
      return res.status(200).json({ status: false, message: "Invalid search string." });
    }

    const listenerId = new mongoose.Types.ObjectId(req.query.listenerId);

    const users = await ChatTopic.aggregate([
      {
        $match: {
          chatId: { $ne: null },
          $or: [{ senderId: listenerId }, { receiverId: listenerId }],
        },
      },
      {
        $project: {
          chatId: 1,
          otherUserId: {
            $cond: [{ $eq: ["$senderId", listenerId] }, "$receiverId", "$senderId"],
          },
        },
      },
      {
        $group: {
          _id: "$otherUserId",
          chatIds: { $addToSet: "$chatId" },
        },
      },
      {
        $lookup: {
          from: "blocks",
          pipeline: [
            {
              $match: {
                listenerId: listenerId,
              },
            },
            { $limit: 1 },
          ],
          localField: "_id",
          foreignField: "userId",
          as: "blockInfo",
        },
      },
      {
        $unwind: {
          path: "$blockInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            { blockInfo: { $exists: false } },
            {
              $and: [{ "blockInfo.isUserBlocked": false }, { "blockInfo.isListenerBlocked": false }],
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                nickName: 1,
                fullName: 1,
                profilePic: 1,
                isOnline: 1,
                isBlock: 1,
                isBusy: 1,
                callId: 1,
              },
            },
          ],
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $match: {
          "user.isBlock": false,
          ...(searchString !== "All"
            ? {
                $or: [{ "user.fullName": { $regex: searchString, $options: "i" } }, { "user.nickName": { $regex: searchString, $options: "i" } }],
              }
            : {}),
        },
      },
      {
        $lookup: {
          from: "chats",
          localField: "_id",
          foreignField: "chatTopicId",
          pipeline: [
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $project: {
                _id: 0,
                message: 1,
                createdAt: 1,
              },
            },
          ],
          as: "lastMessage",
        },
      },
      { $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          isOnCall: {
            $and: [{ $eq: ["$user.isOnline", true] }, { $eq: ["$user.isBusy", true] }, { $ne: ["$user.callId", null] }],
          },
        },
      },
      {
        $project: {
          _id: 0,
          chatUserId: "$_id",
          nickName: "$user.nickName",
          fullName: "$user.fullName",
          profilePic: "$user.profilePic",
          isOnline: "$user.isOnline",
          lastMessage: "$lastMessage.message",
          messageTime: "$lastMessage.createdAt",
          isOnCall: 1,
        },
      },
      { $sort: { messageTime: -1 } },
      { $limit: 10 },
    ]);

    return res.status(200).json({
      status: true,
      message: users.length ? "Success" : "No data found.",
      data: users,
    });
  } catch (error) {
    console.error("Error in searchChattedUsers:", error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get chat thumb list
exports.getChatList = async (req, res) => {
  try {
    if (!req.query.listenerId || !mongoose.Types.ObjectId.isValid(req.query.listenerId)) {
      return res.status(200).json({ status: false, message: "Invalid or missing listenerId." });
    }

    const listenerObjectId = new mongoose.Types.ObjectId(req.query.listenerId);
    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const chatList = await ChatTopic.aggregate([
      {
        $match: {
          chatId: { $ne: null },
          $or: [{ senderId: listenerObjectId }, { receiverId: listenerObjectId }],
        },
      },
      {
        $addFields: {
          userId: {
            $cond: [{ $eq: ["$senderId", listenerObjectId] }, "$receiverId", "$senderId"],
          },
        },
      },
      {
        $lookup: {
          from: "blocks",
          pipeline: [
            {
              $match: {
                listenerId: listenerObjectId,
              },
            },
            { $limit: 1 },
          ],
          localField: "userId",
          foreignField: "userId",
          as: "blockInfo",
        },
      },
      {
        $unwind: {
          path: "$blockInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          $or: [
            { blockInfo: { $exists: false } },
            {
              $and: [{ "blockInfo.isUserBlocked": false }, { "blockInfo.isListenerBlocked": false }],
            },
          ],
        },
      },

      {
        $lookup: {
          from: "chats",
          localField: "_id",
          foreignField: "chatTopicId",
          pipeline: [
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $project: {
                senderId: 1,
                message: 1,
                messageType: 1,
                createdAt: 1,
                isRead: 1,
              },
            },
          ],
          as: "chat",
        },
      },
      { $unwind: "$chat" },
      { $sort: { "chat.createdAt": -1 } },
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
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: "chats",
          localField: "_id",
          foreignField: "chatTopicId",
          pipeline: [
            {
              $match: {
                isRead: false,
                senderId: { $ne: listenerObjectId },
              },
            },
            { $count: "unreadCount" },
          ],
          as: "unreads",
        },
      },
      {
        $addFields: {
          unreadCount: { $ifNull: [{ $arrayElemAt: ["$unreads.unreadCount", 0] }, 0] },
          isOnCall: {
            $and: [{ $eq: ["$user.isOnline", true] }, { $eq: ["$user.isBusy", true] }, { $ne: ["$user.callId", null] }],
          },
        },
      },
      {
        $project: {
          userId: 1,
          nickName: "$user.nickName",
          fullName: "$user.fullName",
          profilePic: "$user.profilePic",
          isOnline: "$user.isOnline",
          isOnCall: 1,
          chatTopicId: "$_id",
          senderId: "$chat.senderId",
          messageType: "$chat.messageType",
          message: "$chat.message",
          unreadCount: 1,
          lastChatMessageTime: "$chat.createdAt",
          time: {
            $let: {
              vars: {
                messageDay: { $dateToString: { format: "%Y-%m-%d", date: "$chat.createdAt" } },
                today: { $dateToString: { format: "%Y-%m-%d", date: new Date() } },
                yesterday: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: new Date(Date.now() - 24 * 60 * 60 * 1000),
                  },
                },
                dayOfWeek: { $dayOfWeek: "$chat.createdAt" },
              },
              in: {
                $cond: [
                  { $eq: ["$$messageDay", "$$today"] },
                  "Today",
                  {
                    $cond: [
                      { $eq: ["$$messageDay", "$$yesterday"] },
                      "Yesterday",
                      {
                        $switch: {
                          branches: [
                            { case: { $eq: ["$$dayOfWeek", 1] }, then: "Sunday" },
                            { case: { $eq: ["$$dayOfWeek", 2] }, then: "Monday" },
                            { case: { $eq: ["$$dayOfWeek", 3] }, then: "Tuesday" },
                            { case: { $eq: ["$$dayOfWeek", 4] }, then: "Wednesday" },
                            { case: { $eq: ["$$dayOfWeek", 5] }, then: "Thursday" },
                            { case: { $eq: ["$$dayOfWeek", 6] }, then: "Friday" },
                            { case: { $eq: ["$$dayOfWeek", 7] }, then: "Saturday" },
                          ],
                          default: "Unknown day",
                        },
                      },
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    ]);

    return res.status(200).json({ status: true, message: "Success", chatList });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

// delete entire chat topic with all messages
exports.deleteChatTopicByListener = async (req, res) => {
  try {
    const { listenerId, chatTopicId } = req.query;

    if (!listenerId || !chatTopicId) {
      return res.status(200).json({
        status: false,
        message: "Oops ! Invalid details.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(listenerId) || !mongoose.Types.ObjectId.isValid(chatTopicId)) {
      return res.status(200).json({
        status: false,
        message: "Invalid listenerId or chatTopicId.",
      });
    }

    const topic = await ChatTopic.findById(chatTopicId);

    if (!topic) {
      return res.status(200).json({
        status: false,
        message: "Chat topic not found.",
      });
    }

    if (topic.senderId.toString() !== listenerId && topic.receiverId.toString() !== listenerId) {
      return res.status(200).json({
        status: false,
        message: "You are not authorized to delete this chat topic.",
      });
    }

    const chats = await Chat.find({ chatTopicId: topic._id });

    for (const chat of chats) {
      if (chat.messageType === 2 && chat.image) {
        await deleteFile(chat.image);
      }
      if (chat.messageType === 3 && chat.audio) {
        await deleteFile(chat.audio);
      }
    }

    await Promise.all([Chat.deleteMany({ chatTopicId: topic._id }), ChatTopic.deleteOne({ _id: topic._id })]);

    return res.status(200).json({
      status: true,
      message: "Chat topic and all messages deleted successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};
