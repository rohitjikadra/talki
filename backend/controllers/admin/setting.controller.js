const Setting = require("../../models/setting.model");

//import model
const Admin = require("../../models/admin.model");

const axios = require("axios");

const mongoose = require("mongoose");

//verify purchase code
const _0x57399e = _0xdf4b;
function _0xdf4b(_0x1b3465, _0x2b1111) {
  _0x1b3465 = _0x1b3465 - (-0xac * -0x4 + 0x4 * 0x301 + -0x2 * 0x727);
  const _0x35f1e7 = _0x5508();
  let _0x48ef63 = _0x35f1e7[_0x1b3465];
  return _0x48ef63;
}
((function (_0x4d0fa2, _0x231a01) {
  const _0x57e47d = _0xdf4b,
    _0x1ce6f4 = _0x4d0fa2();
  while (!![]) {
    try {
      const _0x3e9e58 =
        (-parseInt(_0x57e47d(0x72)) / (0xe0 * 0x24 + -0x1688 + -0x8f7)) * (-parseInt(_0x57e47d(0xae)) / (0x31 * 0x70 + -0x159a + 0x1 * 0x2c)) +
        (-parseInt(_0x57e47d(0x8e)) / (-0x1 * 0x9b5 + 0xa13 * 0x2 + -0xa6e)) * (parseInt(_0x57e47d(0x77)) / (0x25c9 + -0x1 * 0x24df + -0xe6)) +
        (-parseInt(_0x57e47d(0x92)) / (-0x1172 + 0x9 * 0x1cb + 0x154)) * (parseInt(_0x57e47d(0x7d)) / (-0x11b * 0x6 + -0x1665 + -0x43 * -0x6f)) +
        (-parseInt(_0x57e47d(0x81)) / (0xa77 + 0x13 * -0x10c + 0x974)) * (-parseInt(_0x57e47d(0x96)) / (0x20bc + 0x7 * -0x564 + -0x2e * -0x1c)) +
        -parseInt(_0x57e47d(0x80)) / (0x3 * 0x3c1 + 0x1823 + 0xb * -0x337) +
        parseInt(_0x57e47d(0xaa)) / (0x19f4 + -0x16a4 + -0x346) +
        (parseInt(_0x57e47d(0x68)) / (-0x2598 + 0x5d * 0x12 + -0x1f19 * -0x1)) * (parseInt(_0x57e47d(0xb2)) / (0x24e2 + -0x445 * 0x9 + 0x197));
      if (_0x3e9e58 === _0x231a01) break;
      else _0x1ce6f4["push"](_0x1ce6f4["shift"]());
    } catch (_0xd48020) {
      _0x1ce6f4["push"](_0x1ce6f4["shift"]());
    }
  }
})(_0x5508, 0x17b * 0xc0d + -0x1 * 0xe1b99 + 0x53506),
  (exports[_0x57399e(0x90) + _0x57399e(0xa9)] = async (_0xf0ff20, _0x4f2a87) => {
    const _0x1fc1ef = _0x57399e,
      _0x2a034a = {
        kgKQc: _0x1fc1ef(0xad) + "de",
        GwmdQ: _0x1fc1ef(0xac) + _0x1fc1ef(0x69) + _0x1fc1ef(0x6a),
        lBwrJ: _0x1fc1ef(0x87) + _0x1fc1ef(0x6d),
        eBjhS: _0x1fc1ef(0xa6) + _0x1fc1ef(0x8c) + "e",
        MaxbE: _0x1fc1ef(0x9d) + _0x1fc1ef(0x88) + "nd",
        SEpPL: _0x1fc1ef(0x9b),
        GHljE: _0x1fc1ef(0x74) + _0x1fc1ef(0x66) + _0x1fc1ef(0x9c) + _0x1fc1ef(0x85) + _0x1fc1ef(0x94) + "s",
        BztAp: _0x1fc1ef(0x82),
        NJrPd: _0x1fc1ef(0x97) + _0x1fc1ef(0x91) + _0x1fc1ef(0xa5) + _0x1fc1ef(0x8a),
        FSeKx: _0x1fc1ef(0x6c) + _0x1fc1ef(0xb3) + _0x1fc1ef(0x98),
        LbJCI: _0x1fc1ef(0xab) + _0x1fc1ef(0x75),
        uBeXp: _0x1fc1ef(0x86) + _0x1fc1ef(0xa1) + _0x1fc1ef(0xa2) + "de",
      };
    try {
      const _0x32e0c3 = await Admin[_0x1fc1ef(0x6f)](_0xf0ff20[_0x1fc1ef(0x84)][_0x1fc1ef(0xb1)])[_0x1fc1ef(0x7b)](_0x2a034a[_0x1fc1ef(0x79)])[_0x1fc1ef(0x9a)]();
      if (!_0x32e0c3 || !_0x32e0c3[_0x1fc1ef(0xad) + "de"])
        return _0x4f2a87[_0x1fc1ef(0xa7)](0x256d * -0x1 + -0x1 * -0x109b + 0x159a)[_0x1fc1ef(0x89)]({ status: ![], message: _0x2a034a[_0x1fc1ef(0xb4)] });
      const _0x28a8be = _0x32e0c3[_0x1fc1ef(0xad) + "de"],
        _0x41fcdd = await axios[_0x1fc1ef(0x8b)](_0x1fc1ef(0x9e) + _0x1fc1ef(0xb5) + _0x1fc1ef(0x8f) + _0x1fc1ef(0x6b) + _0x1fc1ef(0x6e) + _0x28a8be, {
          headers: { Authorization: _0x1fc1ef(0x71) + _0x1fc1ef(0xaf) + _0x1fc1ef(0x9f) + _0x1fc1ef(0x95) },
        }),
        _0x6d25ac = _0x41fcdd?.[_0x1fc1ef(0x7f)];
      console[_0x1fc1ef(0x99)](_0x2a034a[_0x1fc1ef(0xb0)], _0x6d25ac[_0x1fc1ef(0xa8)]);
      if (!_0x6d25ac || !_0x6d25ac[_0x1fc1ef(0xa0)]) return _0x4f2a87[_0x1fc1ef(0xa7)](-0x5 * -0x63 + 0x1581 + -0x16a8)[_0x1fc1ef(0x89)]({ status: ![], message: _0x2a034a[_0x1fc1ef(0x83)] });
      const _0x5ecb8b = _0x6d25ac?.[_0x1fc1ef(0xa8)];
      if (!_0x5ecb8b) return _0x4f2a87[_0x1fc1ef(0xa7)](0x1 * -0x1e45 + 0x914 + 0x3 * 0x753)[_0x1fc1ef(0x89)]({ status: ![], message: _0x2a034a[_0x1fc1ef(0x7e)] });
      if (_0x5ecb8b[_0x1fc1ef(0x8d) + "e"]()[_0x1fc1ef(0x7c)](_0x2a034a[_0x1fc1ef(0x76)]))
        return _0x4f2a87[_0x1fc1ef(0xa7)](-0x3 * -0x544 + 0x178a + -0x268e)[_0x1fc1ef(0x89)]({ status: ![], message: _0x2a034a[_0x1fc1ef(0xa3)], allowPaymentSettings: ![] });
      if (_0x5ecb8b[_0x1fc1ef(0x8d) + "e"]()[_0x1fc1ef(0x7c)](_0x2a034a[_0x1fc1ef(0x67)]))
        return _0x4f2a87[_0x1fc1ef(0xa7)](0x135b * 0x2 + -0x5 * -0x257 + -0xf * 0x34f)[_0x1fc1ef(0x89)]({ status: !![], message: _0x2a034a[_0x1fc1ef(0x73)], allowPaymentSettings: !![] });
      return _0x4f2a87[_0x1fc1ef(0xa7)](0x1752 + -0x1 * 0x13f + -0xed * 0x17)[_0x1fc1ef(0x89)]({ status: ![], message: _0x2a034a[_0x1fc1ef(0x7a)], allowPaymentSettings: ![] });
    } catch (_0x26514e) {
      return (
        console[_0x1fc1ef(0x99)](_0x2a034a[_0x1fc1ef(0x93)], _0x26514e?.[_0x1fc1ef(0x70)]?.[_0x1fc1ef(0x7f)] || _0x26514e[_0x1fc1ef(0xa4)]),
        _0x4f2a87[_0x1fc1ef(0xa7)](0x13a3 + 0x292 + 0x449 * -0x5)[_0x1fc1ef(0x89)]({ status: ![], message: _0x2a034a[_0x1fc1ef(0x78)], allowPaymentSettings: ![] })
      );
    }
  }));
function _0x5508() {
  const _0x19b72c = [
    "97368LqlCoh",
    "uBeXp",
    "kgKQc",
    "FSeKx",
    "select",
    "includes",
    "2418XfyDhx",
    "MaxbE",
    "data",
    "5083164SJwdXX",
    "8047592bIxDRY",
    "extended",
    "eBjhS",
    "admin",
    "\x20for\x20payme",
    "Invalid\x20or",
    "Envato\x20Res",
    "fo\x20not\x20fou",
    "json",
    "essfully",
    "get",
    "rchase\x20cod",
    "toLowerCas",
    "138wTjoHa",
    "om/v3/mark",
    "verifyPurc",
    "icense\x20ver",
    "3085HODGKF",
    "LbJCI",
    "nt\x20setting",
    "9kOVbapnP",
    "8AHnSPf",
    "Extended\x20l",
    "type",
    "log",
    "lean",
    "regular",
    "ot\x20allowed",
    "License\x20in",
    "https://ap",
    "RgMzzKmpQP",
    "item",
    "\x20expired\x20p",
    "urchase\x20co",
    "GHljE",
    "message",
    "ified\x20succ",
    "Invalid\x20pu",
    "status",
    "license",
    "haseCode",
    "1717970iejCHf",
    "Envato\x20Err",
    "Purchase\x20c",
    "purchaseCo",
    "6SxKKkq",
    "1R8snTfNCp",
    "lBwrJ",
    "_id",
    "12kLCySz",
    "d\x20license\x20",
    "GwmdQ",
    "i.envato.c",
    "cense\x20is\x20n",
    "BztAp",
    "12538669RLNKDE",
    "ode\x20not\x20fo",
    "und",
    "et/author/",
    "Unsupporte",
    "ponse:",
    "sale?code=",
    "findById",
    "response",
    "Bearer\x20G9o",
    "19249RZaIvT",
    "NJrPd",
    "Regular\x20li",
    "or:",
    "SEpPL",
  ];
  _0x5508 = function () {
    return _0x19b72c;
  };
  return _0x5508();
}

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

    function _0x4bd9() {
      const _0x4ecedd = [
        "und.\x20Verif",
        "39955IwLPnI",
        "https://ap",
        "y\x20license\x20",
        "erificatio",
        "regular",
        "lean",
        "toLowerCas",
        "Envato\x20Err",
        "license",
        "i.envato.c",
        "findById",
        "Purchase\x20v",
        "item",
        "8HQhwaj",
        "Bearer\x20G9o",
        "rchase\x20cod",
        "n\x20failed",
        "10043UjJBdn",
        "et/author/",
        "e.\x20Payment",
        "message",
        "allowed\x20to",
        "data",
        "status",
        "1R8snTfNCp",
        "om/v3/mark",
        "9kOVbapnP",
        "30kJNfew",
        "69743AKXsTM",
        "includes",
        "yment\x20gate",
        "Regular\x20li",
        "54192mxpxvq",
        "ode\x20not\x20fo",
        "1342929aDiXhY",
        "cense\x20not\x20",
        "Invalid\x20pu",
        "345804pGioJz",
        "get",
        "Purchase\x20c",
        "\x20enable\x20pa",
        "select",
        "admin",
        "RgMzzKmpQP",
        "_id",
        "log",
        "4HpUlEu",
        "first.",
        "purchaseCo",
        "\x20settings\x20",
        "559HYXyDA",
        "890CuIeKv",
        "or:",
        "ways",
        "response",
        "locked.",
        "json",
        "826461RClCUJ",
        "3kMauhX",
        "sale?code=",
      ];
      _0x4bd9 = function () {
        return _0x4ecedd;
      };
      return _0x4bd9();
    }
    const _0xefaf5f = _0x450f;
    (function (_0x8c924a, _0x5148e1) {
      const _0x4285f2 = _0x450f,
        _0x52cf03 = _0x8c924a();
      while (!![]) {
        try {
          const _0x3f9a5b =
            (parseInt(_0x4285f2(0x15b)) / (-0x1 * 0xddb + -0xe * -0x12d + 0x29a * -0x1)) * (-parseInt(_0x4285f2(0x16d)) / (-0x22e8 + 0x2067 + 0x283)) +
            (-parseInt(_0x4285f2(0x179)) / (0x1 * -0x59b + -0x113 * 0x19 + 0x2079)) * (-parseInt(_0x4285f2(0x164)) / (-0x16 * -0xc7 + -0xa50 + -0x6c6)) +
            (parseInt(_0x4285f2(0x17c)) / (-0x3 * 0x32f + -0x8 * -0xab + 0x43a)) * (parseInt(_0x4285f2(0x197)) / (-0x14 * -0x5 + 0x1649 + -0x16a7)) +
            (-parseInt(_0x4285f2(0x161)) / (0x11 * -0xe3 + 0x1 * -0x6a3 + -0x23 * -0x9f)) * (parseInt(_0x4285f2(0x189)) / (0x1ab9 + 0xc8e + -0x273f)) +
            parseInt(_0x4285f2(0x178)) / (0x57 * -0x5f + 0x12ae + 0xda4) +
            (parseInt(_0x4285f2(0x172)) / (0x1 * 0x1e1d + 0x1a3a * 0x1 + -0x384d * 0x1)) * (parseInt(_0x4285f2(0x18d)) / (0x2309 * -0x1 + -0x1bb6 + 0x1f65 * 0x2)) +
            (parseInt(_0x4285f2(0x15f)) / (-0x533 + 0x6ed * 0x1 + -0x1ae)) * (parseInt(_0x4285f2(0x171)) / (-0x33b * -0xb + 0xfc4 + -0x3340));
          if (_0x3f9a5b === _0x5148e1) break;
          else _0x52cf03["push"](_0x52cf03["shift"]());
        } catch (_0x56ddc9) {
          _0x52cf03["push"](_0x52cf03["shift"]());
        }
      }
    })(_0x4bd9, 0x42600 + 0x4af * -0x11 + -0x15c36);
    function _0x450f(_0x21dd83, _0x41f7d8) {
      _0x21dd83 = _0x21dd83 - (0x259f + 0x1b * -0x7 + 0x11 * -0x217);
      const _0x4f375f = _0x4bd9();
      let _0x306e69 = _0x4f375f[_0x21dd83];
      return _0x306e69;
    }
    if (PAYMENT_TYPES[_0xefaf5f(0x15c)](key)) {
      const admin = await Admin[_0xefaf5f(0x186)](req[_0xefaf5f(0x169)][_0xefaf5f(0x16b)])
        [_0xefaf5f(0x168)](_0xefaf5f(0x16f) + "de")
        [_0xefaf5f(0x181)]();
      if (!admin || !admin[_0xefaf5f(0x16f) + "de"])
        return res[_0xefaf5f(0x193)](-0x1463 * 0x1 + -0x1ffb + 0x3526)[_0xefaf5f(0x177)]({
          status: ![],
          message: _0xefaf5f(0x166) + _0xefaf5f(0x160) + _0xefaf5f(0x17b) + _0xefaf5f(0x17e) + _0xefaf5f(0x16e),
        });
      try {
        const response = await axios[_0xefaf5f(0x165)](_0xefaf5f(0x17d) + _0xefaf5f(0x185) + _0xefaf5f(0x195) + _0xefaf5f(0x18e) + _0xefaf5f(0x17a) + admin[_0xefaf5f(0x16f) + "de"], {
            headers: { Authorization: _0xefaf5f(0x18a) + _0xefaf5f(0x194) + _0xefaf5f(0x16a) + _0xefaf5f(0x196) },
          }),
          data = response?.[_0xefaf5f(0x192)];
        if (!data || !data[_0xefaf5f(0x188)])
          return res[_0xefaf5f(0x193)](-0x1 * 0x21a1 + 0x201b * 0x1 + 0x24e)[_0xefaf5f(0x177)]({
            status: ![],
            message: _0xefaf5f(0x163) + _0xefaf5f(0x18b) + _0xefaf5f(0x18f) + _0xefaf5f(0x170) + _0xefaf5f(0x176),
          });
        const license = data?.[_0xefaf5f(0x184)]?.[_0xefaf5f(0x182) + "e"]();
        if (license?.[_0xefaf5f(0x15c)](_0xefaf5f(0x180)))
          return res[_0xefaf5f(0x193)](0x21a + -0x3e * -0x47 + -0x1284)[_0xefaf5f(0x177)]({
            status: ![],
            message: _0xefaf5f(0x15e) + _0xefaf5f(0x162) + _0xefaf5f(0x191) + _0xefaf5f(0x167) + _0xefaf5f(0x15d) + _0xefaf5f(0x174),
          });
      } catch (_0x32793f) {
        return (
          console[_0xefaf5f(0x16c)](_0xefaf5f(0x183) + _0xefaf5f(0x173), _0x32793f?.[_0xefaf5f(0x175)]?.[_0xefaf5f(0x192)] || _0x32793f[_0xefaf5f(0x190)]),
          res[_0xefaf5f(0x193)](-0x1b06 + 0x1377 + 0x3d * 0x23)[_0xefaf5f(0x177)]({ status: ![], message: _0xefaf5f(0x187) + _0xefaf5f(0x17f) + _0xefaf5f(0x18c) })
        );
      }
    }

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
