//express
const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../util/checkAccess");

//controller
const ChatTopicController = require("../../controllers/listener/chatTopic.controller");

//search user (chat)
route.get("/searchChattedUsers", checkAccessWithSecretKey(), ChatTopicController.searchChattedUsers);

//get chat thumb list
route.get("/getChatList", checkAccessWithSecretKey(), ChatTopicController.getChatList);

//delete chat topic
route.delete("/deleteChatTopicByListener", checkAccessWithSecretKey(), ChatTopicController.deleteChatTopicByListener);

module.exports = route;
