//express
const express = require("express");
const route = express.Router();

//multer
const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

const checkAccessWithSecretKey = require("../../util/checkAccess");

//controller
const languageController = require("../../controllers/admin/language.controller");

route.use(checkAccessWithSecretKey());

// create Language
route.post("/createALanguage", upload.single("languageIcon"), languageController.createALanguage);

// get all languages
route.get("/getEntireLanguages", languageController.getEntireLanguages);

// get single Language
route.get("/getOneLanguage", languageController.getOneLanguage);

// update Language
route.patch("/updateOneLanguage", upload.single("languageIcon"), languageController.updateOneLanguage);

// toggle isActive and isDefault switch
route.patch("/toggleActiveAndDefaultSwitch", languageController.toggleActiveAndDefaultSwitch);

// delete Language and its Translations
route.delete("/deleteOneLanguage", languageController.deleteOneLanguage);

module.exports = route;
