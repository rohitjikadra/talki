//express
const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../util/checkAccess");

//controller
const BlockController = require("../../controllers/listener/block.controller");

//handle listener blocking a user
route.post("/blockUser", checkAccessWithSecretKey(), BlockController.blockUser);

//get blocked users for a listener
route.get("/getBlockedUsersForListener", checkAccessWithSecretKey(), BlockController.getBlockedUsersForListener);

module.exports = route;
