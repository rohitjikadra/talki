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

//check the user is exists or not ( currently only email-password )
exports.verifyUserExistence = async (req, res) => {
  try {
    const { identity, email, password, loginType } = req.query;

    if (loginType === undefined) {
      return res.status(200).json({ status: false, message: "loginType is required." });
    }

    // TEMP DISABLED: Mobile number existence check (loginType 3) — currently only email-password is enabled
    // if (Number(loginType) === 3) {
    //   if (!identity) {
    //     return res.status(200).json({ status: false, message: "identity is required for loginType 3." });
    //   }
    //
    //   const user = await User.findOne({ identity, loginType: 3 }).select("_id").lean();
    //
    //   return res.status(200).json({
    //     status: true,
    //     message: user ? "User login successfully." : "User must sign up.",
    //     isLogin: !!user,
    //   });
    // }

    // ACTIVE: Email-password existence check (loginType 4)
    if (Number(loginType) === 4) {
      if (!email) {
        return res.status(200).json({ status: false, message: "email required for loginType 4." });
      }

      const user = await User.findOne({ email: email.trim(), loginType: 4 });

      if (user) {
        return res.status(200).json({
          status: true,
          message: "User login successfully.",
          isLogin: true,
        });
      } else {
        return res.status(200).json({
          status: true,
          message: "User must sign up.",
          isLogin: false,
        });
      }
    }

    // Only loginType 4 (email-password) is allowed for now
    return res.status(200).json({ status: false, message: "Unsupported loginType. Only email-password (loginType 4) is enabled." });
  } catch (error) {
    console.error("checkUser error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//user login and sign up
exports.authenticateOrRegisterUser = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(200).json({ status: false, message: "Request body is missing." });
    }

    const { identity, loginType, fcmToken, email, password, countryCode, phoneNumber, nickName, fullName, profilePic, birthDate } = req.body;

    if (!identity || loginType === undefined || !fcmToken) {
      if (req.file) deleteFile(req.file);
      return res.status(200).json({ status: false, message: "Oops! Invalid details!!" });
    }

    const { uid, provider } = req.user;
    let userQuery = {};

    // TEMP: Only email-password login (loginType 4) is enabled for now.
    // Other login types are commented below (not deleted) so they can be re-enabled later.
    switch (loginType) {
      // TEMP DISABLED: Google login (loginType 1)
      // case 1:
      //   if (!email) {
      //     if (req.file) deleteFile(req.file);
      //     return res.status(200).json({ status: false, message: "Email is required." });
      //   }
      //   userQuery = { email: email.trim(), loginType: 1 };
      //   break;

      // TEMP DISABLED: Quick/Device login (loginType 2)
      // case 2:
      //   if (!identity && !email) {
      //     if (req.file) deleteFile(req.file);
      //     return res.status(200).json({ status: false, message: "Either identity or email is required." });
      //   }
      //   // userQuery = {};
      //   userQuery = { firebaseId: uid, loginType: 2 };
      //   break;

      // TEMP DISABLED: Mobile number login (loginType 3)
      // case 3:
      //   if (!phoneNumber) {
      //     if (req.file) deleteFile(req.file);
      //     return res.status(200).json({ status: false, message: "Phone number is required." });
      //   }
      //   userQuery = { phoneNumber, loginType: 3 };
      //   break;

      // ACTIVE: Email-password login/register (loginType 4)
      case 4:
        if (!email) {
          if (req.file) deleteFile(req.file);
          return res.status(200).json({ status: false, message: "Email is required." });
        }

        // Password is required for email-password flow (Firebase + backend bcrypt)
        if (!password) {
          if (req.file) deleteFile(req.file);
          return res.status(200).json({ status: false, message: "Password is required." });
        }

        // Token email must match body email (prevent token misuse)
        if (!req.user.email || req.user.email.toLowerCase() !== email.trim().toLowerCase()) {
          if (req.file) deleteFile(req.file);
          return res.status(403).json({ status: false, message: "Token email does not match request email." });
        }

        userQuery = { email: email.trim(), loginType: 4 };
        break;

      // TEMP DISABLED: Apple login (loginType 5)
      // case 5:
      //   if (!email) {
      //     if (req.file) deleteFile(req.file);
      //     return res.status(400).json({ status: false, message: "email is required for Apple login." });
      //   }
      //   userQuery = { email: email.trim(), loginType: 5 };
      //   break;

      default:
        if (req.file) deleteFile(req.file);
        // Only loginType 4 is allowed right now
        return res.status(200).json({ status: false, message: "Invalid loginType. Only email-password is enabled." });
    }

    let user = null;
    if (userQuery && Object.keys(userQuery).length > 0) {
      // Include password + firebaseId for login verification (not returned in final response)
      user = await User.findOne(userQuery).select("_id loginType nickName fullName profilePic email password firebaseId fcmToken lastlogin isBlock isListener listenerId");
    }

    if (user) {
      if (user.firebaseId && user.firebaseId !== uid) {
        console.log("If a user exists but firebaseId mismatch");
        console.warn(`⚠️ UID mismatch — token UID (${uid}) vs user.firebaseId (${user.firebaseId})`);
        return res.status(403).json({
          status: false,
          message: "Identity already taken or unauthorized login attempt.",
        });
      }

      // Backend bcrypt password verify (Firebase token already verified in middleware)
      if (loginType === 4) {
        const { match, needsRehash } = await verifyPassword(password, user.password);
        if (!match) {
          return res.status(401).json({ status: false, message: "Invalid email or password." });
        }

        // Lazy migration: old Cryptr password → bcrypt hash
        if (needsRehash) {
          user.password = await hashPassword(password);
        }
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
      user.fullName = fullName?.trim() || user.fullName;
      user.profilePic = req.file ? req.file.path : profilePic || user.profilePic;
      user.fcmToken = fcmToken || user.fcmToken;
      user.lastlogin = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      await user.save();

      // Do not send password hash to client
      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.firebaseId;

      return res.status(200).json({
        status: true,
        message: "User logged in.",
        user: userResponse,
        signUp: false,
      });
    } else {
      const [existingFirebaseUser, userUniqueId, historyUniqueId] = await Promise.all([User.exists({ firebaseId: uid }), generateUniqueId(), generateHistoryUniqueId()]);

      if (existingFirebaseUser) {
        return res.status(200).json({ status: false, message: "User with this Firebase ID already exists." });
      }

      const bonusCoins = settingJSON.dailyLoginBonusCoins ?? 5000;

      // Hash password with bcrypt before saving (loginType 4)
      const hashedPassword = password ? await hashPassword(password) : "";

      const newUser = new User({
        loginType,
        fullName: fullName || "",
        nickName: nickName || "",
        countryCode: countryCode || "",
        phoneNumber: phoneNumber || "",
        email: email?.trim(),
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

      // Save user first, then respond (avoid success without DB persistence)
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
        user: {
          _id: newUser._id,
          loginType: newUser.loginType,
          name: newUser.fullName,
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
    user.fullName = req.body.fullName ? req.body.fullName : user.fullName;
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

    const user = await User.findOne({ email: email.trim(), loginType: 4 }).select("+password firebaseId");
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
