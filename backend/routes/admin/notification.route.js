//express
const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../util/checkAccess");

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

//controller
const AdminNotification = require("../../controllers/admin/notification.controller");


// send notifications to users by role
route.post("/sendNotifications", checkAccessWithSecretKey(), upload.single("image"), AdminNotification.sendNotifications);

// send notification to single role
route.post("/sendSingleNotification", checkAccessWithSecretKey(), upload.single("image"), AdminNotification.sendSingleNotification);

module.exports = route;
