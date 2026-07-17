//express
const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../util/checkAccess");

//controller
const reportController = require("../../controllers/user/report.controller");

// Submit report
route.post("/submitReport", checkAccessWithSecretKey(), reportController.submitReport);

module.exports = route;
