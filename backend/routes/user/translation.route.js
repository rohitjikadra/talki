const express = require("express");
const localizationController = require("../../controllers/user/translation.controller");

const router = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../util/checkAccess");

router.use(checkAccessWithSecretKey());

// get single language's translations
router.get("/getOneLanguageTranslations", localizationController.getOneLanguageTranslations);

// get all languages and their translations
router.get("/getMultiLanguagesTranslations", localizationController.getMultiLanguagesTranslations);

// get latest version of global language system
router.get("/getVersionOfTranslations", localizationController.getVersionOfTranslations);

// get all active languages
router.get("/getActiveLanguages", localizationController.getActiveLanguages);

module.exports = router;
