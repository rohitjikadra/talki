const Notification = require("../../models/notification.model");
const User = require("../../models/user.model");
const Listener = require("../../models/listener.model");

const { deleteFile } = require("../../util/deletefile");

const admin = require("../../util/privateKey");

const mongoose = require("mongoose");

// send notifications to users by role
exports.sendNotifications = async (req, res) => {
  try {
    let { notificationType, title, message } = req.body || {};

    if (!notificationType?.trim()) {
      if (req.file) deleteFile(req.file);
      return res.status(400).json({ status: false, message: "notificationType is required!" });
    }

    if (!title?.trim() || !message?.trim()) {
      if (req.file) deleteFile(req.file);
      return res.status(400).json({ status: false, message: "Title and message are required!" });
    }

    notificationType = notificationType.trim().toLowerCase();
    const image = req.file ? req.file.path : "";
    const date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    let users = [];
    let listeners = [];

    if (notificationType === "user") {
      users = await User.find(
        {
          isBlock: false,
          isNotificationEnabled: true,
          fcmToken: { $ne: null },
        },
        "_id fcmToken",
      ).lean();
    } else if (notificationType === "listener") {
      listeners = await Listener.find(
        {
          isBlock: false,
          isNotificationEnabled: true,
          fcmToken: { $ne: null },
        },
        "_id fcmToken",
      ).lean();
    } else if (notificationType === "all") {
      [users, listeners] = await Promise.all([
        User.find(
          {
            isBlock: false,
            isNotificationEnabled: true,
            fcmToken: { $ne: null },
          },
          "_id fcmToken",
        ).lean(),
        Listener.find(
          {
            isBlock: false,
            isNotificationEnabled: true,
            fcmToken: { $ne: null },
          },
          "_id fcmToken",
        ).lean(),
      ]);
    } else {
      if (req.file) deleteFile(req.file);
      return res.status(400).json({ status: false, message: "Invalid notificationType!" });
    }

    if (!users.length && !listeners.length) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: true, message: "No recipients found." });
    }

    const notifications = [
      ...users.map((u) => ({
        userId: u._id,
        title,
        message,
        image,
        date,
      })),
      ...listeners.map((l) => ({
        listenerId: l._id,
        title,
        message,
        image,
        date,
      })),
    ];

    await Notification.insertMany(notifications);

    const tokens = [...users.map((u) => u.fcmToken), ...listeners.map((l) => l.fcmToken)].filter((token) => typeof token === "string" && token.trim());

    res.status(200).json({
      status: true,
      message: "Bulk notification sent successfully.",
    });

    if (tokens.length) {
      const adminInstance = await admin;
      const chunkSize = 500;
      const batches = [];

      for (let i = 0; i < tokens.length; i += chunkSize) {
        batches.push(
          adminInstance.messaging().sendEachForMulticast({
            tokens: tokens.slice(i, i + chunkSize),
            data: {
              title,
              body: message,
            },
          }),
        );
      }

      const results = await Promise.all(batches);

      let totalSuccess = 0;
      let totalFailure = 0;

      results.forEach((batchResult, batchIndex) => {
        totalSuccess += batchResult.successCount;
        totalFailure += batchResult.failureCount;

        batchResult.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error("FCM TOKEN FAILED:", {
              batch: batchIndex,
              error: resp.error?.message,
            });
          }
        });
      });

      console.log("BULK FCM SUMMARY:", {
        totalTokens: tokens.length,
        totalSuccess,
        totalFailure,
      });
    }
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.error("sendBulkNotification error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// send notification to single role
exports.sendSingleNotification = async (req, res) => {
  try {
    let { notificationType, userId, title, message } = req.body || {};

    if (!notificationType?.trim() || !userId || !mongoose.Types.ObjectId.isValid(userId)) {
      if (req.file) deleteFile(req.file);
      return res.status(400).json({
        status: false,
        message: "notificationType and valid userId are required!",
      });
    }

    if (!title?.trim() || !message?.trim()) {
      if (req.file) deleteFile(req.file);
      return res.status(400).json({
        status: false,
        message: "Title and message are required!",
      });
    }

    notificationType = notificationType.trim().toLowerCase();
    const date = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

    let target = null;
    let token = null;

    if (notificationType === "user") {
      target = await User.findOne(
        {
          _id: userId,
          isBlock: false,
          isNotificationEnabled: true,
          fcmToken: { $ne: null },
        },
        "_id fcmToken",
      ).lean();

      if (!target) {
        if (req.file) deleteFile(req.file);
        return res.status(404).json({ status: false, message: "User not found." });
      }

      const image = req.file ? req.file.path : "";
      try {
        const adminPromise = await admin;
        adminPromise
          .messaging()
          .send({
            token: target.fcmToken,
            data: {
              title,
              body: message,
              image,
            },
          })
          .then(async (response) => {
            console.log("Successfully sent with response: ", response);

            await Notification.create({
              userId: target._id,
              title,
              message,
              image,
              date,
            });
          })
          .catch((error) => {
            console.log("Error sending message notificationType user :      ", error);
          });
      } catch (fcmError) {
        if (req.file) deleteFile(req.file);
        console.error("FCM ERROR:", { userId: target._id, error: fcmError.message });
      }

    } else if (notificationType === "listener") {
      target = await Listener.findOne(
        {
          _id: userId,
          isBlock: false,
          isNotificationEnabled: true,
          fcmToken: { $ne: null },
        },
        "_id fcmToken",
      ).lean();

      if (!target) {
        if (req.file) deleteFile(req.file);
        return res.status(404).json({ status: false, message: "Listener not found." });
      }

      const image = req.file ? req.file.path : "";
      try {
        const adminPromise = await admin;
        adminPromise
          .messaging()
          .send({
            token: target.fcmToken,
            data: {
              title,
              body: message,
              image,
            },
          })
          .then(async (response) => {
            console.log("Successfully sent with response: ", response);

            await Notification.create({
              listenerId: target._id,
              title,
              message,
              date,
              image,
            });
          })
          .catch((error) => {
            if (req.file) deleteFile(req.file);
            console.log("Error sending message notificationType user :      ", error);
          });
      } catch (fcmError) {
        if (req.file) deleteFile(req.file);
        console.error("FCM ERROR:", { listenerId: target._id, error: fcmError.message });
      }

    } else {
      if (req.file) deleteFile(req.file);
      return res.status(400).json({ status: false, message: "Invalid notificationType!" });
    }

    return res.status(200).json({
      status: true,
      message: "Notification sent successfully.",
    });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.error("sendSingleNotification error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};
