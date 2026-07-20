const User = require("../../models/user.model");

//fs
const fs = require("fs");

//mongoose
const mongoose = require("mongoose");

//Cryptr (kept commented — replaced by bcrypt for user passwords)
// const Cryptr = require("cryptr");
// const cryptr = new Cryptr("myTotallySecretKey");

// bcrypt password helpers (hash + verify, with legacy Cryptr migration)
const { hashPassword, verifyPassword } = require("../../util/password");

//import model
const History = require("../../models/history.model");
const Listener = require("../../models/listener.model");
const Notification = require("../../models/notification.model");

//deletefile
const { deleteFile } = require("../../util/deletefile");

//unique Id
const generateUniqueId = require("../../util/generateUniqueId");
const generateHistoryUniqueId = require("../../util/generateHistoryUniqueId");

//private key
const admin = require("../../util/privateKey");

//deleteUserDataById
const deleteUserDataById = require("../../util/deleteUserDataById");

//path
const path = require("path");
// auto-detect email vs mobile (no client loginType needed)
const { detectIdentifier, normalizePhoneDigits, isSamePhone, resolveDialCode } = require("../../util/authIdentifier");

// first_name + last_name → fullName (request fullName ignored)
const { resolveNameFields, hasRequiredNames } = require("../../util/resolveNameFields");


//check the user is exists or not (email OR mobile via identifier)
exports.verifyUserExistence = async (req, res) => {
  try {
    // Preferred: identifier (email or mobile). Fallback: email / phoneNumber for old clients.
    const { identifier, email, phoneNumber, countryCode } = req.query;
    const rawIdentifier = identifier || email || phoneNumber;

    // TEMP: loginType is optional now (auto-detect). Kept for backward-compatible clients.
    // if (loginType === undefined) {
    //   return res.status(200).json({ status: false, message: "loginType is required." });
    // }

    const detected = detectIdentifier(rawIdentifier);
    if (!detected.type) {
      return res.status(200).json({ status: false, message: detected.message || "Invalid identifier." });
    }

    let user = null;

    if (detected.type === "email") {
      user = await User.findOne({ email: detected.value }).select("_id").lean();
    } else {
      // Mobile: match local digits or dial+local (countryCode is ISO like "IN")
      const phoneDigits = detected.value;
      const dial = countryCode ? resolveDialCode(countryCode) : "";
      const withCountry = dial ? `${dial}${phoneDigits}` : null;

      user = await User.findOne({
        $or: [{ phoneNumber: phoneDigits }, ...(withCountry ? [{ phoneNumber: withCountry }] : []), ...(phoneNumber ? [{ phoneNumber: String(phoneNumber).trim() }] : [])],
      })
        .select("_id")
        .lean();
    }

    return res.status(200).json({
      status: true,
      message: user ? "User login successfully." : "User must sign up.",
      isLogin: !!user,
      loginMethod: detected.type, // "email" | "mobile" — for client info only
    });
  } catch (error) {
    console.error("checkUser error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//user login and sign up (email OR mobile login; register requires BOTH email + mobile)
exports.authenticateOrRegisterUser = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(200).json({ status: false, message: "Request body is missing." });
    }

    const {
      identity,
      // loginType — NOT required anymore (auto-detect). Kept for old clients / legacy only.
      loginType,
      fcmToken,
      identifier,
      email,
      password,
      countryCode,
      phoneNumber,
      nickName,
      // fullName from request is IGNORED — always built from first_name + last_name
      profilePic,
      birthDate,
    } = req.body;

    // API tags: first_name, last_name (compulsory) → DB: firstName, lastName, fullName (joined)
    const nameFields = resolveNameFields(req.body);

    if (!identity || !fcmToken) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Oops! Invalid details!! identity and fcmToken are required." });
    }

    if (!password) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Password is required." });
    }

    const { uid, provider, email: tokenEmail, phone: tokenPhone } = req.user;

    // Normalize email / phone from body (used for register + optional login)
    const bodyEmail = email ? String(email).trim().toLowerCase() : "";
    const bodyPhoneDigits = phoneNumber ? normalizePhoneDigits(phoneNumber) : "";
    const bodyCountryCode = countryCode ? String(countryCode).trim().toUpperCase() : "";

    // Login identifier: email OR mobile (auto-detect). Fallback to email/phoneNumber fields.
    const rawIdentifier = identifier || email || phoneNumber;
    const detected = detectIdentifier(rawIdentifier);

    if (!detected.type) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: detected.message || "Invalid identifier." });
    }

    // Resolve lookup contact for LOGIN
    let lookupEmail = detected.type === "email" ? detected.value : bodyEmail;
    let lookupPhone = detected.type === "mobile" ? detected.value : bodyPhoneDigits;
    let lookupCountryCode = bodyCountryCode;
    let resolvedLoginType = detected.type === "email" ? 4 : 3;

    // Token must match the login method being used
    if (detected.type === "email") {
      if (!tokenEmail || tokenEmail.toLowerCase() !== lookupEmail) {
        if (req.file) deleteFile(req.file);
        return res.status(403).json({ status: false, message: "Token email does not match request email." });
      }
    } else {
      if (!tokenPhone || !isSamePhone(tokenPhone, lookupCountryCode, lookupPhone)) {
        if (req.file) deleteFile(req.file);
        return res.status(403).json({ status: false, message: "Token phone does not match request mobile." });
      }
    }

    // Find existing user by email OR phone (one user = one password)
    let user = null;
    if (detected.type === "email") {
      user = await User.findOne({ email: lookupEmail }).select(
        "_id loginType nickName fullName firstName lastName profilePic email phoneNumber countryCode password firebaseId fcmToken lastlogin isBlock isListener listenerId",
      );
    } else {
      const dial = lookupCountryCode ? resolveDialCode(lookupCountryCode) : "";
      const withCountry = dial ? `${dial}${lookupPhone}` : null;
      user = await User.findOne({
        $or: [{ phoneNumber: lookupPhone }, ...(withCountry ? [{ phoneNumber: withCountry }] : []), ...(phoneNumber ? [{ phoneNumber: String(phoneNumber).trim() }] : [])],
      }).select("_id loginType nickName fullName firstName lastName profilePic email phoneNumber countryCode password firebaseId fcmToken lastlogin isBlock isListener listenerId");
    }

    // ===================== LOGIN =====================
    if (user) {
      if (user.firebaseId && user.firebaseId !== uid) {
        console.warn(`⚠️ UID mismatch — token UID (${uid}) vs user.firebaseId (${user.firebaseId})`);
        return res.status(403).json({
          status: false,
          message: "Identity already taken or unauthorized login attempt.",
        });
      }

      // Backend bcrypt password verify (same password for email or mobile)
      const { match, needsRehash } = await verifyPassword(password, user.password);
      if (!match) {
        return res.status(401).json({ status: false, message: "Invalid credentials." });
      }

      // Lazy migration: old Cryptr password → bcrypt hash
      if (needsRehash) {
        user.password = await hashPassword(password);
      }

      if (user.isBlock) {
        return res.status(403).json({ status: false, message: "🚷 User is blocked by the admin." });
      }

      if (user.isListener && user.listenerId) {
        const listener = await Listener.findById(user.listenerId).select("isBlock fcmToken identity");
        if (listener?.isBlock) {
          return res.status(403).json({ status: false, message: "🚷 Listener account is blocked by the admin." });
        }

        await Listener.updateOne(
          { _id: user.listenerId },
          {
            $set: {
              fcmToken: fcmToken || listener?.fcmToken,
              identity: identity || listener?.identity,
            },
          },
        );
      }

      user.nickName = nickName?.trim() || user.nickName;
      // Login pe names optional update — only if BOTH first_name + last_name sent
      if (hasRequiredNames(req.body)) {
        user.firstName = nameFields.firstName;
        user.lastName = nameFields.lastName;
        user.fullName = nameFields.fullName;
      }
      user.profilePic = req.file ? req.file.path : profilePic || user.profilePic;
      user.fcmToken = fcmToken || user.fcmToken;
      user.lastlogin = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      await user.save();

      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.firebaseId;

      return res.status(200).json({
        status: true,
        message: "User logged in.",
        user: userResponse,
        signUp: false,
        loginMethod: detected.type,
      });
    }

    // ===================== REGISTER =====================
    // Compulsory: email + mobile + countryCode + first_name + last_name
    if (!hasRequiredNames(req.body)) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({
        status: false,
        message: "first_name and last_name are required for registration.",
      });
    }

    if (!bodyEmail) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Email is required for registration." });
    }

    const emailCheck = detectIdentifier(bodyEmail);
    if (emailCheck.type !== "email") {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Invalid email format." });
    }

    if (!bodyPhoneDigits) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Mobile number is required for registration." });
    }

    if (!bodyCountryCode) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "countryCode is required for registration (e.g. IN)." });
    }

    const phoneCheck = detectIdentifier(bodyPhoneDigits);
    if (phoneCheck.type !== "mobile") {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Invalid mobile number." });
    }

    const registerEmail = emailCheck.value;
    const registerPhone = phoneCheck.value;
    const registerCountryCode = bodyCountryCode; // ISO like "IN"
    const registerDial = resolveDialCode(registerCountryCode);
    const registerPhoneWithCountry = registerDial ? `${registerDial}${registerPhone}` : registerPhone;

    if (!registerDial) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Invalid countryCode. Use ISO code like IN." });
    }

    // Token must match at least one of email/phone from Firebase auth used during register
    const emailTokenOk = tokenEmail && tokenEmail.toLowerCase() === registerEmail;
    const phoneTokenOk = tokenPhone && isSamePhone(tokenPhone, registerCountryCode, registerPhone);
    if (!emailTokenOk && !phoneTokenOk) {
      if (req.file) deleteFile(req.file);
      return res.status(403).json({
        status: false,
        message: "Firebase token does not match the provided email or mobile.",
      });
    }

    // Ensure email / mobile not already used by another account
    const [existingByEmail, existingByPhone, existingFirebaseUser, userUniqueId, historyUniqueId] = await Promise.all([
      User.findOne({ email: registerEmail }).select("_id").lean(),
      User.findOne({
        $or: [{ phoneNumber: registerPhone }, { phoneNumber: registerPhoneWithCountry }],
      })
        .select("_id")
        .lean(),
      User.exists({ firebaseId: uid }),
      generateUniqueId(),
      generateHistoryUniqueId(),
    ]);

    if (existingByEmail) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Email is already registered." });
    }

    if (existingByPhone) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Mobile number is already registered." });
    }

    if (existingFirebaseUser) {
      return res.status(200).json({ status: false, message: "User with this Firebase ID already exists." });
    }

    const bonusCoins = settingJSON.dailyLoginBonusCoins ?? 5000;
    const hashedPassword = await hashPassword(password);

    // Store BOTH email + mobile on same user (one password for both login methods)
    const newUser = new User({
      loginType: resolvedLoginType, // how they registered this time (record only)
      firstName: nameFields.firstName,
      lastName: nameFields.lastName,
      fullName: nameFields.fullName, // ONLY from first_name + last_name (request fullName ignored)
      nickName: nickName || "",
      countryCode: registerCountryCode,
      phoneNumber: registerPhone,
      email: registerEmail,
      password: hashedPassword,
      profilePic: req.file ? req.file.path : profilePic,
      fcmToken,
      identity,
      uniqueId: userUniqueId,
      firebaseId: uid,
      authProvider: provider,
      coins: bonusCoins,
      birthDate,
      lastlogin: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    });

    try {
      await Promise.all([
        newUser.save(),
        History.create({
          type: 1,
          uniqueId: historyUniqueId,
          userId: newUser._id,
          userCoin: bonusCoins,
          date: newUser.date,
        }),
      ]);
    } catch (saveError) {
      console.error("User register save failed:", saveError);
      return res.status(500).json({ status: false, message: "Registration failed. Please try again." });
    }

    res.status(200).json({
      status: true,
      message: "A new user has registered an account.",
      signUp: true,
      loginMethod: detected.type,
      user: {
        _id: newUser._id,
        loginType: newUser.loginType,
        name: newUser.fullName,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        countryCode: newUser.countryCode,
        profilePic: newUser.profilePic,
        fcmToken: newUser.fcmToken,
        lastlogin: newUser.lastlogin,
      },
    });

    if (newUser?.fcmToken) {
      const payload = {
        token: newUser.fcmToken,
        data: {
          title: "🚀 Instant Bonus Activated! 🎁",
          body: "🎊 Hooray! You've unlocked a special welcome reward just for joining us. Enjoy your bonus! 💰",
          type: "LOGINBONUS",
        },
      };

      try {
        const adminInstance = await admin;
        const response = await adminInstance.messaging().send(payload);
        console.log("Successfully sent with response: ", response);

        const notification = new Notification({
          userId: newUser._id,
          title: payload.data.title,
          message: payload.data.body,
          date: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        });

        await notification.save();
      } catch (err) {
        console.error("Error sending FCM notification:", err);
      }
    }
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.error("Error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};


//update user's profile
exports.updateUserProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    res.status(200).json({ status: true, message: "The user's profile has been modified." });

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const [user] = await Promise.all([User.findOne({ _id: userId })]);

    if (req?.file) {
      const profilePic = user?.profilePic?.split("storage");
      if (profilePic) {
        const profilePicPath = "storage" + profilePic[1];
        if (fs.existsSync(profilePicPath)) {
          const profilePicName = profilePicPath?.split("/")?.pop();
          if (profilePicName) {
            fs.unlinkSync(profilePicPath);
          }
        }
      }

      user.profilePic = req.file.path;
    }

    user.nickName = req.body.nickName ? req.body.nickName : user.nickName;

    // Profile name update: first_name + last_name compulsory together; request fullName ignored
    if (req.body.first_name !== undefined || req.body.firstName !== undefined || req.body.last_name !== undefined || req.body.lastName !== undefined) {
      if (!hasRequiredNames(req.body)) {
        if (req.file) deleteFile(req.file);
        return res.status(200).json({
          status: false,
          message: "first_name and last_name are both required to update name.",
        });
      }
      const profileNames = resolveNameFields(req.body);
      user.firstName = profileNames.firstName;
      user.lastName = profileNames.lastName;
      user.fullName = profileNames.fullName;
    }

    user.email = req.body.email ? req.body.email : user.email;
    user.birthDate = req.body.birthDate ? req.body.birthDate : user.birthDate;
    user.gender = req.body.gender ? req.body.gender?.toLowerCase()?.trim() : user.gender;
    user.bio = req.body.bio ? req.body.bio : user.bio;
    user.age = req.body.age ? req.body.age : user.age;
    user.countryCode = req.body.countryCode ? req.body.countryCode : user.countryCode;
    user.phoneNumber = req.body.phoneNumber ? req.body.phoneNumber : user.phoneNumber;
    user.countryFlag = req.body.countryFlag ? req.body.countryFlag : user.countryFlag;
    user.country = req.body.country ? req.body.country.toLowerCase()?.trim() : user.country;
    await user.save();
  } catch (error) {
    if (req.file) deleteFile(req.file);
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get user's profile
exports.getUserProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const [user] = await Promise.all([User.findOne({ _id: userId }).lean()]);

    res.status(200).json({ status: true, message: "The user has retrieved their profile.", user: user });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//update password
exports.modifyPassword = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ status: false, message: "Unauthorized access. Invalid token." });
    }

    if (req.user.userId && !mongoose.Types.ObjectId.isValid(req.user.userId)) {
      return res.status(200).json({ status: false, message: "Invalid userId. Please provide a valid ObjectId." });
    }

    const { oldPass, newPass, confirmPass } = req.query;

    if (!oldPass || !newPass || !confirmPass) {
      return res.status(200).json({ status: false, message: "All password fields are required." });
    }

    if (newPass !== confirmPass) {
      return res.status(200).json({ status: false, message: "New and Confirm passwords do not match." });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);

    const user = await User.findById(userId).select("+password firebaseId");
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    if (user.isBlock) {
      return res.status(403).json({ status: false, message: "You are blocked by the admin." });
    }

    // Backend bcrypt verify old password (supports legacy Cryptr too)
    const { match } = await verifyPassword(oldPass, user.password);
    if (!match) {
      return res.status(200).json({ status: false, message: "Old password does not match." });
    }

    const hashedPassword = await hashPassword(newPass);

    // Keep Firebase + Mongo password in sync
    if (user.firebaseId) {
      try {
        const adminInstance = await admin;
        await adminInstance.auth().updateUser(user.firebaseId, { password: newPass });
      } catch (firebaseError) {
        console.error("Firebase password update failed:", firebaseError);
        return res.status(500).json({
          status: false,
          message: "Failed to update password in Firebase. Mongo password not changed.",
        });
      }
    }

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//set password ( forgot password )
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.query;

    if (!email) {
      return res.status(200).json({ status: false, message: "Email is required." });
    }

    if (!newPassword || !confirmPassword) {
      return res.status(200).json({ status: false, message: "Both password fields are required." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(200).json({ status: false, message: "Passwords do not match." });
    }

    const user = await User.findOne({ email: email.trim() }).select("+password firebaseId");
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found with the provided email." });
    }

    if (user.isBlock) {
      return res.status(403).json({ status: false, message: "You are blocked by the admin." });
    }

    const hashedPassword = await hashPassword(newPassword);

    // Keep Firebase + Mongo password in sync
    if (user.firebaseId) {
      try {
        const adminInstance = await admin;
        await adminInstance.auth().updateUser(user.firebaseId, { password: newPassword });
      } catch (firebaseError) {
        console.error("Firebase password reset failed:", firebaseError);
        return res.status(500).json({
          status: false,
          message: "Failed to update password in Firebase. Mongo password not changed.",
        });
      }
    }

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Password has been set successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//toggling the user's notification permission status
exports.modifyNotificationPermission = async (req, res, next) => {
  try {
    const userUid = req.headers["x-auth-uid"];
    if (!userUid) {
      console.warn("⚠️ [AUTH] User UID missing.");
      return res.status(401).json({ status: false, message: "User UID required for authentication." });
    }

    const user = await User.findOne({ firebaseId: userUid }).select("_id isNotificationEnabled");
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    res.status(200).json({
      status: true,
      message: `Notifications have been ${user.isNotificationEnabled ? "enabled" : "disabled"} successfully.`,
    });

    user.isNotificationEnabled = !user.isNotificationEnabled;
    await user.save();
  } catch (error) {
    console.error("❌ Error toggling notification permission:", error);
    return res.status(500).json({ status: false, message: "An error occurred while updating notification permission." });
  }
};

//delete user account
exports.deleteSelfAccount = async (req, res) => {
  try {
    const userUid = req.headers["x-auth-uid"];
    if (!userUid) {
      console.warn("⚠️ [AUTH] User UID.");
      return res.status(401).json({ status: false, message: "User UID required for authentication." });
    }

    const user = await User.findOne({ firebaseId: userUid }).lean();
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    res.status(200).json({
      status: true,
      message: "User and related data successfully deleted.",
    });

    await deleteUserDataById(user._id, user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get user coin
exports.retrieveUserCoinBalance = async (req, res) => {
  try {
    const userUid = req.headers["x-auth-uid"];
    if (!userUid) {
      console.warn("⚠️ [AUTH] User UID.");
      return res.status(401).json({ status: false, message: "User UID required for authentication." });
    }

    const user = await User.findOne({ firebaseId: userUid }).select("_id coins").lean();
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    return res.status(200).json({ status: true, message: "User coin balance retrieved successfully.", coin: user.coins || 0 });
  } catch (error) {
    console.error("Error fetching user coin balance:", error);
    return res.status(500).json({ status: false, message: "An error occurred while retrieving user coin balance.", error: error.message });
  }
};

//get listener languages
exports.getAllListenerLanguages = async (req, res) => {
  try {
    const languages = await Listener.distinct("language", {
      isFake: false,
      isBlock: false,
      status: 2,
      language: { $exists: true, $not: { $size: 0 } },
    });

    console.log("languages:", languages);

    return res.status(200).json({
      status: true,
      message: "Unique listener languages fetched successfully",
      data: languages,
    });
  } catch (error) {
    console.error("Error fetching listener languages:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
};

//update user interest for listener-matching
exports.saveUserInterests = async (req, res) => {
  try {
    const userUid = req.headers["x-auth-uid"];
    if (!userUid) {
      console.warn("⚠️ [AUTH] User UID.");
      return res.status(401).json({ status: false, message: "User UID required for authentication." });
    }

    const user = await User.findOne({ firebaseId: userUid }).select("_id").lean();
    if (!user) {
      return res.status(200).json({ status: false, message: "User not found." });
    }

    const { therapyType, gender, ageRange, country, sexualOrientation, religion, takesMedication, preferredLanguage, needHelpWith, communicationType } = req.body;

    const requiredFields = {
      therapyType,
      gender,
      ageRange,
      country,
      sexualOrientation,
      religion,
      takesMedication,
      preferredLanguage,
      needHelpWith,
      communicationType,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => value === undefined || value === null || value === "")
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(200).json({
        status: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    let helpTopics = [];
    if (typeof needHelpWith === "string") {
      helpTopics = needHelpWith
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean);
    } else if (Array.isArray(needHelpWith)) {
      helpTopics = needHelpWith.map((topic) => topic.trim()).filter(Boolean);
    } else {
      return res.status(200).json({
        status: false,
        message: "Invalid format for needHelpWith. Provide comma-separated string or array.",
      });
    }

    const update = {
      interests: {
        therapyType,
        gender: gender.trim().toLowerCase(),
        ageRange,
        country: country.trim().toLowerCase(),
        sexualOrientation,
        religion,
        takesMedication,
        preferredLanguage,
        needHelpWith: helpTopics,
        communicationType,
      },
    };

    res.status(200).json({
      status: true,
      message: "User interests saved successfully",
      interests: update.interests,
    });

    await User.findByIdAndUpdate(user._id, { $set: update }, { new: true });
  } catch (error) {
    console.error("Error saving user interests:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// GET Firebase UID using Device UUID
exports.getfirebaseIdByDeviceId = async (req, res) => {
  try {
    const { deviceUuid, loginType } = req.query;

    if (!deviceUuid) {
      return res.status(400).json({
        status: false,
        message: "Device UUID is required.",
      });
    }

    if (!loginType) {
      return res.status(400).json({
        status: false,
        message: "Login type is required.",
      });
    }

    const user = await User.findOne({ identity: deviceUuid.trim(), loginType: Number(loginType) }, { firebaseId: 1 }).lean();

    if (!user || !user.firebaseId) {
      return res.status(404).json({
        status: false,
        message: "Firebase UID not found for this device.",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Firebase UID fetched successfully.",
      firebaseId: user.firebaseId,
    });
  } catch (error) {
    console.error("Fetch Firebase UID Error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// CREATE Firebase Custom Token using Firebase UID
exports.generateFirebaseCustomToken = async (req, res) => {
  try {
    const { firebaseId } = req.query;

    if (!firebaseId) {
      return res.status(400).json({
        status: false,
        message: "Firebase UID is required.",
      });
    }

    const firebaseAdmin = await admin;
    const customToken = await firebaseAdmin.auth().createCustomToken(firebaseId);

    return res.status(200).json({
      status: true,
      message: "Firebase custom auth token created successfully.",
      customToken,
    });
  } catch (error) {
    console.error("Create Custom Token Error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Failed to create Firebase custom auth token.",
    });
  }
};
