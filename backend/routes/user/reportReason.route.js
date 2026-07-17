const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../util/checkAccess");

const reportReasonController = require("../../controllers/user/reportReason.controller");

// Get all report reasons
route.get("/fetchReportReasons", checkAccessWithSecretKey(), reportReasonController.fetchReportReasons);

module.exports = route;
