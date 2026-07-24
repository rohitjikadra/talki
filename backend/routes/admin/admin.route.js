const express = require("express");
const multer = require("multer");

const route = express.Router();

const checkAccessWithSecretKey = require("../../util/checkAccess");
const validateAdminAuth = require("../../middleware/validateAdminAuth.middleware");
const AdminController = require("../../controllers/admin/admin.controller");
const AdminCreateController = require("../../controllers/admin/adminCreate.controller");
const storage = require("../../util/multer");

const upload = multer({ storage });

// First-time admin registration (secret key only)
route.post("/initiateAdminRegistration", checkAccessWithSecretKey(), AdminController.initiateAdminRegistration);

// Admin login
route.post("/authenticateAdmin", validateAdminAuth, checkAccessWithSecretKey(), AdminController.authenticateAdmin);

// Create additional admin (Firebase Auth + MongoDB)
route.post("/createAdmin", validateAdminAuth, checkAccessWithSecretKey(), AdminCreateController.createAdmin);

// Profile
route.patch(
  "/updateProfileDetails",
  validateAdminAuth,
  checkAccessWithSecretKey(),
  upload.single("image"),
  AdminController.updateProfileDetails
);
route.get("/fetchAdminProfile", validateAdminAuth, checkAccessWithSecretKey(), AdminController.fetchAdminProfile);

// Password
route.patch("/updatePassword", validateAdminAuth, checkAccessWithSecretKey(), AdminController.updatePassword);
route.patch("/initiatePasswordReset", checkAccessWithSecretKey(), AdminController.initiatePasswordReset);
route.patch("/confirmPasswordReset", checkAccessWithSecretKey(), AdminController.confirmPasswordReset);

// Email verify
route.get("/verifyAdminEmail", checkAccessWithSecretKey(), AdminController.verifyAdminEmail);

module.exports = route;
