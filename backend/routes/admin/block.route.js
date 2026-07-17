//express
const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../util/checkAccess");

//controller
const BlockController = require("../../controllers/admin/block.controller");

//get blocked listeners by the user
route.get("/listBlockedListenersForUser", checkAccessWithSecretKey(), BlockController.listBlockedListenersForUser);

//get blocked users by the listener
route.get("/listBlockedUsersForListener", checkAccessWithSecretKey(), BlockController.listBlockedUsersForListener);

module.exports = route;
