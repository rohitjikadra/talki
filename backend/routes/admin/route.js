//express
const express = require("express");
const route = express.Router();

//validate admin's access token
const validateAdminAuth = require("../../middleware/validateAdminAuth.middleware");

//require admin's route.js
const admin = require("./admin.route");
const talkTopic = require("./talkTopic.route");
const faq = require("./faq.route");
const identityproof = require("./identityProof.route");
const listener = require("./listener.route");
const coinplan = require("./coinplan.route");
const paymentOption = require("./paymentOption.route");
const dashboard = require("./dashboard.route");
const user = require("./user.route");
const withdrawalRecord = require("./withdrawalRecord.route");
const history = require("./history.route");
const currency = require("./currency.route");
const setting = require("./setting.route");
const notification = require("./notification.route");
const block = require("./block.route");
const report = require("./report.route");
const reportReason = require("./reportReason.route");
const language = require("./language.route");
const translation = require("./translation.route");

//exports admin's route.js
route.use("/", admin);
route.use("/talkTopic", validateAdminAuth, talkTopic);
route.use("/faq", validateAdminAuth, faq);
route.use("/identityproof", validateAdminAuth, identityproof);
route.use("/listener", validateAdminAuth, listener);
route.use("/coinplan", validateAdminAuth, coinplan);
route.use("/paymentOption", validateAdminAuth, paymentOption);
route.use("/dashboard", validateAdminAuth, dashboard);
route.use("/user", validateAdminAuth, user);
route.use("/withdrawalRecord", validateAdminAuth, withdrawalRecord);
route.use("/history", validateAdminAuth, history);
route.use("/currency", validateAdminAuth, currency);
route.use("/setting", validateAdminAuth, setting);
route.use("/notification", validateAdminAuth, notification);
route.use("/block", validateAdminAuth, block);
route.use("/report", validateAdminAuth, report);
route.use("/reportReason", validateAdminAuth, reportReason);
route.use("/language", validateAdminAuth, language);
route.use("/translation", validateAdminAuth, translation);

module.exports = route;
