const Cryptr = require("cryptr");
const Admin = require("../../models/admin.model");
const firebaseAdminPromise = require("../../util/privateKey");

const cryptr = new Cryptr("myTotallySecretKey");

/**
 * Create an additional admin in Firebase Auth + MongoDB.
 * Requires an already authenticated admin (validateAdminAuth) + secret key.
 */
exports.createAdmin = async (req, res) => {
  let firebaseUid = null;

  try {
    const email = req.body?.email?.trim();
    const password = req.body?.password?.trim();
    const name = req.body?.name?.trim() || "";

    if (!email || !password) {
      return res.status(200).json({ status: false, message: "Oops! Invalid details!" });
    }

    const existingByEmail = await Admin.findOne({ email }).select("_id").lean();
    if (existingByEmail) {
      return res.status(200).json({ status: false, message: "Admin already exists with that email." });
    }

    const hasExistingAdmin = await Admin.exists({});
    if (!hasExistingAdmin) {
      return res.status(200).json({
        status: false,
        message: "No existing admin found. Complete first-time registration first.",
      });
    }

    const firebaseAdmin = await firebaseAdminPromise;
    const firebaseUser = await firebaseAdmin.auth().createUser({
      email,
      password,
      displayName: name || undefined,
    });
    firebaseUid = firebaseUser.uid;

    const admin = new Admin({
      uid: firebaseUid,
      email,
      name,
      password: cryptr.encrypt(password),
    });

    await admin.save();

    const adminResponse = admin.toObject();
    delete adminResponse.password;

    return res.status(200).json({
      status: true,
      message: "Admin created successfully.",
      admin: adminResponse,
    });
  } catch (error) {
    if (firebaseUid) {
      try {
        const firebaseAdmin = await firebaseAdminPromise;
        await firebaseAdmin.auth().deleteUser(firebaseUid);
      } catch (rollbackError) {
        console.error("Failed to rollback Firebase admin user:", rollbackError.message);
      }
    }

    if (error?.code === "auth/email-already-exists") {
      return res.status(200).json({
        status: false,
        message: "Email already exists in Firebase Auth.",
      });
    }

    if (error?.code === "auth/invalid-email") {
      return res.status(200).json({ status: false, message: "Invalid email address." });
    }

    if (error?.code === "auth/weak-password") {
      return res.status(200).json({
        status: false,
        message: "Password is too weak. Use at least 6 characters.",
      });
    }

    console.error("createAdmin error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};
