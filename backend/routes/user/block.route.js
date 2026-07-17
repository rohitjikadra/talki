//express
const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../util/checkAccess");

//controller
const BlockController = require("../../controllers/user/block.controller");

//validate user's access token
const validateUserAuthToken = require("../../middleware/validateUserAuthToken.middleware");

//handle user blocking a listener
route.post("/blockListener", validateUserAuthToken, checkAccessWithSecretKey(), BlockController.blockListener);

//get blocked listeners for a user
route.get("/getBlockedListenersForUser", validateUserAuthToken, checkAccessWithSecretKey(), BlockController.getBlockedListenersForUser);

module.exports = route;
