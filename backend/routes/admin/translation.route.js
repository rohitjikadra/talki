const express = require("express");

const localizationController = require("../../controllers/admin/translation.controller");
const checkAccessWithSecretKey = require("../../util/checkAccess");

const router = express.Router();

const multer = require("multer");
const storage = require("../../util/multer");
const upload = multer({ storage });

router.use(checkAccessWithSecretKey());

// create Translations for languages using CSV file
router.post("/uploadFile", upload.single("file"), localizationController.uploadFile);

// Update specific key-value pairs for a language
router.patch("/updateTranslationsOfLanguage", localizationController.updateTranslationsOfLanguage);

// download all translations as CSV file
router.get("/downloadTranslationsCSV", localizationController.downloadTranslationsCSV);

// get single Language's translations
router.get("/getOneLanguageTranslations", localizationController.getOneLanguageTranslations);

module.exports = router;
