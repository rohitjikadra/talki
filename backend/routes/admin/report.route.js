const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../util/checkAccess");
const reportController = require("../../controllers/admin/report.controller");

// Solve a report
route.patch("/solveUserListenerReport", checkAccessWithSecretKey(), reportController.solveUserListenerReport);

// Get all user-listener reports
route.get("/getUserListenerReports", checkAccessWithSecretKey(), reportController.getUserListenerReports);

// Delete a report
route.delete("/deleteUserListenerReport", checkAccessWithSecretKey(), reportController.deleteUserListenerReport);

module.exports = route;
