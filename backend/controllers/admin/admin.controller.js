const fs = require("fs");
const Cryptr = require("cryptr");

const Admin = require("../../models/admin.model");
const Setting = require("../../models/setting.model");
const Login = require("../../models/login.model");
const { deleteFile } = require("../../util/deletefile");

const cryptr = new Cryptr("myTotallySecretKey");

// First-time admin registration
exports.initiateAdminRegistration = async (req, res) => {
  try {
    const { uid, email, password, privateKey } = req.body || {};
    const trimmedUid = uid?.trim();
    const trimmedEmail = email?.trim();
    const trimmedPassword = password?.trim();

    if (!trimmedUid || !trimmedEmail || !trimmedPassword || !privateKey) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid or missing details." });
    }

    const [existingAdmin, loginDoc, setting] = await Promise.all([
      Admin.findOne().select("_id").lean(),
      Login.findOne(),
      Setting.findOne({}),
    ]);

    if (!setting) {
      return res.status(200).json({ status: false, message: "Settings document not found in database." });
    }

    if (!setting.privateKey || typeof setting.privateKey !== "object") {
      return res.status(200).json({
        status: false,
        message: "Settings document is invalid (missing privateKey).",
      });
    }

    if (privateKey !== undefined) {
      let parsedPrivateKey;
      try {
        parsedPrivateKey = typeof privateKey === "string" ? JSON.parse(privateKey.trim()) : privateKey;
      } catch {
        return res.status(200).json({ status: false, message: "privateKey must be valid JSON." });
      }

      if (!parsedPrivateKey || Object.keys(parsedPrivateKey).length === 0) {
        return res.status(200).json({ status: false, message: "privateKey cannot be empty." });
      }

      const requiredFields = ["project_id", "private_key", "client_email"];
      const missingFields = requiredFields.filter(
        (field) => !parsedPrivateKey[field] || typeof parsedPrivateKey[field] !== "string"
      );

      if (missingFields.length > 0) {
        return res.status(200).json({
          status: false,
          message: "Invalid privateKey. Missing fields: " + missingFields.join(", "),
        });
      }
    }

    if (existingAdmin) {
      return res.status(200).json({ status: false, message: "Admin is already registered." });
    }

    const admin = new Admin({
      uid: trimmedUid,
      email: trimmedEmail,
      password: cryptr.encrypt(trimmedPassword),
    });
    await admin.save();

    if (loginDoc) {
      loginDoc.login = true;
      await loginDoc.save();
    } else {
      const newLogin = new Login({ login: true });
      await newLogin.save();
    }

    res.status(200).json({ status: true, message: "Admin created successfully!", admin });

    if (privateKey) {
      try {
        setting.privateKey = typeof privateKey === "string" ? JSON.parse(privateKey.trim()) : privateKey;
        await setting.save();
        updateSettingFile(setting);
        setTimeout(() => {
          process.exit(0);
        }, 500);
        return;
      } catch {
        return res.status(200).json({
          status: false,
          message: "Invalid privateKey format. Must be valid JSON.",
        });
      }
    }
  } catch (error) {
    console.error("handleAdminRegistration error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Admin login (email + password)
exports.authenticateAdmin = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    const admin = await Admin.findOne({ email }).lean();
    if (!admin) {
      return res.status(200).json({ status: false, message: "Oops! Admin not found with that email." });
    }

    if (cryptr.decrypt(admin.password) !== password) {
      return res.status(200).json({ status: false, message: "Oops! Password doesn't match!" });
    }

    return res.status(200).json({
      status: true,
      message: "Admin has successfully logged in.",
      admin,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// Update admin name / email / image
exports.updateProfileDetails = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const existing = await Admin.findById(adminId).select("name email image password").lean();

    if (!existing) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Admin not found!" });
    }

    const updateData = {
      name: req.body?.name || existing.name,
      email: req.body?.email ? req.body.email.trim() : existing.email,
    };

    if (req.file) {
      if (existing.image) {
        const imagePath = existing.image.includes("storage")
          ? "storage" + existing.image.split("storage")[1]
          : "";

        if (imagePath && fs.existsSync(imagePath)) {
          const fileName = imagePath.split("/").pop();
          if (fileName) fs.unlinkSync(imagePath);
        }
      }
      updateData.image = req.file.path;
    }

    const updated = await Admin.findByIdAndUpdate(req.admin._id, updateData, {
      new: true,
      select: "name email image password",
    }).lean();

    updated.password = cryptr.decrypt(updated.password);

    return res.status(200).json({
      status: true,
      message: "Admin profile has been updated.",
      data: updated,
    });
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// Fetch logged-in admin profile
exports.fetchAdminProfile = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const admin = await Admin.findById(adminId).select("_id name email password image flag").lean();

    if (!admin) {
      return res.status(200).json({ status: false, message: "Admin not found." });
    }

    admin.password = cryptr.decrypt(admin.password);

    return res.status(200).json({
      status: true,
      message: "Admin profile retrieved successfully!",
      data: admin,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// Start password reset (validates email exists) — same behavior as original
exports.initiatePasswordReset = async (req, res) => {
  try {
    if (!req.query.email) {
      return res.status(200).json({ status: false, message: "email must be requried." });
    }

    const email = req.query.email.trim();
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(200).json({
        status: false,
        message: "admin does not found with that email.",
      });
    }
    // Original implementation does not send a success response body here.
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// Change password (authenticated admin)
exports.updatePassword = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(200).json({ status: false, message: "admin does not found." });
    }

    const { oldPass, newPass, confirmPass } = req.body || {};

    if (!oldPass || !newPass || !confirmPass) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    if (cryptr.decrypt(admin.password) !== oldPass) {
      return res.status(200).json({ status: false, message: "Oops! Password doesn't match!" });
    }

    if (newPass !== confirmPass) {
      return res.status(200).json({
        status: false,
        message: "Oops! New Password and Confirm Password don't match!",
      });
    }

    admin.password = cryptr.encrypt(newPass);
    const [saved, refreshed] = await Promise.all([admin.save(), Admin.findById(admin._id)]);
    refreshed.password = cryptr.decrypt(saved.password);

    return res.status(200).json({
      status: true,
      message: "Password has been changed by the admin.",
      data: refreshed,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// Confirm password reset with query email + body passwords
exports.confirmPasswordReset = async (req, res) => {
  try {
    if (!req.query.email) {
      return res.status(200).json({ status: false, message: "Email is required." });
    }

    const admin = await Admin.findOne({ email: req.query.email.trim() });
    if (!admin) {
      return res.status(200).json({
        status: false,
        message: "Admin not found with the provided email.",
      });
    }

    const { newPassword, confirmPassword } = req.body || {};

    if (!newPassword || !confirmPassword) {
      return res.status(200).json({ status: false, message: "Oops ! Invalid details!" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(200).json({
        status: false,
        message: "Oops! New Password and Confirm Password don't match!",
      });
    }

    admin.password = cryptr.encrypt(newPassword);
    await admin.save();
    admin.password = cryptr.decrypt(admin?.password);

    return res.status(200).json({
      status: true,
      message: "Password has been updated Successfully.",
      data: admin,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};

// Verify admin email exists
exports.verifyAdminEmail = async (req, res) => {
  try {
    if (!req.query.email) {
      return res.status(200).json({ status: false, message: "Email is required." });
    }

    const admin = await Admin.findOne({ email: req.query.email.trim() });
    if (!admin) {
      return res.status(200).json({
        status: false,
        message: "Admin not found with the provided email.",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Admin email verified successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};
