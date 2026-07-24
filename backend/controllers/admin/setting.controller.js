const Setting = require("../../models/setting.model");

const mongoose = require("mongoose");

//update setting
exports.modifySetting = async (req, res) => {
  try {
    if (!req.query.settingId || !mongoose.Types.ObjectId.isValid(req.query.settingId)) {
      return res.status(200).json({ status: false, message: "Valid settingId is required." });
    }

    const setting = await Setting.findById(req.query.settingId);
    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    setting.helpdeskEmail = req.body.helpdeskEmail ? req.body.helpdeskEmail.trim() : setting.helpdeskEmail;

    setting.zegoAppId = req.body.zegoAppId ? req.body.zegoAppId.trim() : setting.zegoAppId;
    setting.zegoAppSignIn = req.body.zegoAppSignIn ? req.body.zegoAppSignIn.trim() : setting.zegoAppSignIn;

    setting.userPrivacyPolicyUrl = req.body.userPrivacyPolicyUrl ? req.body.userPrivacyPolicyUrl.trim() : setting.userPrivacyPolicyUrl;
    setting.listenerPrivacyPolicyUrl = req.body.listenerPrivacyPolicyUrl ? req.body.listenerPrivacyPolicyUrl.trim() : setting.listenerPrivacyPolicyUrl;
    setting.aboutUsUrl = req.body.aboutUsUrl ? req.body.aboutUsUrl.trim() : setting.aboutUsUrl;

    setting.paystackPublicKey = req.body.paystackPublicKey ? req.body.paystackPublicKey.trim() : setting.paystackPublicKey;
    setting.paystackSecretKey = req.body.paystackSecretKey ? req.body.paystackSecretKey.trim() : setting.paystackSecretKey;
    setting.cashfreeClientId = req.body.cashfreeClientId ? req.body.cashfreeClientId.trim() : setting.cashfreeClientId;
    setting.cashfreeClientSecret = req.body.cashfreeClientSecret ? req.body.cashfreeClientSecret.trim() : setting.cashfreeClientSecret;
    setting.paypalClientId = req.body.paypalClientId ? req.body.paypalClientId.trim() : setting.paypalClientId;
    setting.paypalSecretKey = req.body.paypalSecretKey ? req.body.paypalSecretKey.trim() : setting.paypalSecretKey;

    setting.stripePublicKey = req.body.stripePublicKey ? req.body.stripePublicKey.trim() : setting.stripePublicKey;
    setting.stripeSecretKey = req.body.stripeSecretKey ? req.body.stripeSecretKey.trim() : setting.stripeSecretKey;
    setting.razorpayKeyId = req.body.razorpayKeyId ? req.body.razorpayKeyId.trim() : setting.razorpayKeyId;
    setting.razorpayKeySecret = req.body.razorpayKeySecret ? req.body.razorpayKeySecret.trim() : setting.razorpayKeySecret;
    setting.flutterwavePublicKey = req.body.flutterwavePublicKey ? req.body.flutterwavePublicKey.trim() : setting.flutterwavePublicKey;
    setting.dailyLoginBonusCoins = req.body.dailyLoginBonusCoins ? Number(req.body.dailyLoginBonusCoins) : setting.dailyLoginBonusCoins;
    setting.adminCommissionPercent = req.body.adminCommissionPercent ? Number(req.body.adminCommissionPercent) : setting.adminCommissionPercent;
    setting.minimumCoinsForConversion = req.body.minimumCoinsForConversion ? Number(req.body.minimumCoinsForConversion) : setting.minimumCoinsForConversion;
    setting.minimumCoinsForPayout = req.body.minimumCoinsForPayout ? Number(req.body.minimumCoinsForPayout) : setting.minimumCoinsForPayout;

    if ("androidAppVersion" in req.body) {
      setting.androidAppVersion = req.body.androidAppVersion.trim();
    }
    if ("iosAppVersion" in req.body) {
      setting.iosAppVersion = req.body.iosAppVersion.trim();
    }
    if ("androidAppLink" in req.body) {
      setting.androidAppLink = req.body.androidAppLink.trim();
    }
    if ("iosAppLink" in req.body) {
      setting.iosAppLink = req.body.iosAppLink.trim();
    }

    if (req.body.privateKey) {
      setting.privateKey = typeof req.body.privateKey === "string" ? JSON.parse(req.body.privateKey.trim()) : req.body.privateKey;
    }

    setting.videoCallRatePrivate = req.body.videoCallRatePrivate !== undefined ? Number(req.body.videoCallRatePrivate) : setting.videoCallRatePrivate;
    setting.audioCallRatePrivate = req.body.audioCallRatePrivate !== undefined ? Number(req.body.audioCallRatePrivate) : setting.audioCallRatePrivate;
    setting.videoCallRateRandom = req.body.videoCallRateRandom !== undefined ? Number(req.body.videoCallRateRandom) : setting.videoCallRateRandom;
    setting.audioCallRateRandom = req.body.audioCallRateRandom !== undefined ? Number(req.body.audioCallRateRandom) : setting.audioCallRateRandom;

    await setting.save();

    res.status(200).json({
      status: true,
      message: "Setting has been Updated.",
      data: setting,
    });

    updateSettingFile(setting);

    if (req.body.privateKey) {
      try {
        setTimeout(() => {
          console.log("🔐 Private key updated, restarting server...");
          process.exit(0);
        }, 500); // 0.5s delay
        return;
      } catch (err) {
        console.error("Failed to update privateKey:", err);
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//update setting switch
exports.toggleAppSetting = async (req, res) => {
  try {
    const { settingId, type } = req.query;

    if (!settingId || !type || !mongoose.Types.ObjectId.isValid(settingId)) {
      return res.status(200).json({ status: false, message: "Invalid settingId or type!" });
    }

    const setting = await Setting.findById(settingId);
    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting not found" });
    }

    const key = type.trim();

    const PAYMENT_TYPES = [
      "isGooglePlayEnabled",
      "isStripeEnabled",
      "isRazorpayEnabled",
      "isFlutterwaveEnabled",
      "isGooglePlayIosEnabled",
      "isStripeIosEnabled",
      "isRazorpayIosEnabled",
      "isFlutterwaveIosEnabled",
      "isPaystackAndroidEnabled",
      "isPaystackIosEnabled",
      "isCashfreeAndroidEnabled",
      "isCashfreeIosEnabled",
      "isPaypalAndroidEnabled",
      "isPaypalIosEnabled",
    ];

    const ALLOWED_KEYS = [...PAYMENT_TYPES, "isDemoContentEnabled", "isApplicationLive", "allowBecomeHostOption"];

    if (!ALLOWED_KEYS.includes(key)) {
      return res.status(200).json({ status: false, message: "Invalid type" });
    }

    setting[key] = !setting[key];
    await setting.save();

    updateSettingFile(setting);

    return res.status(200).json({
      status: true,
      message: "Setting updated successfully",
      data: setting,
    });
  } catch (error) {
    console.log("Toggle Error:", error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//get setting
exports.getSettingsData = async (req, res) => {
  try {
    const setting = settingJSON ? settingJSON : null;
    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    return res.status(200).json({ status: true, message: "Success", data: setting });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
