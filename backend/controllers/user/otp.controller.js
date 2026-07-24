const User = require("../../models/user.model");
const { requestOtp, confirmOtp, normalizeEmailTarget, normalizeMobileTarget } = require("../../util/otpService");

const ensureNotAlreadyRegistered = async (channel, email, phoneNumber, countryCode) => {
  if (channel === "email") {
    const norm = normalizeEmailTarget(email);
    if (!norm.ok) return norm;
    const exists = await User.findOne({ email: norm.target }).select("_id").lean();
    if (exists) {
      return { ok: false, message: "Email is already registered." };
    }
    return { ok: true };
  }

  const norm = normalizeMobileTarget(phoneNumber, countryCode);
  if (!norm.ok) return norm;

  const exists = await User.findOne({
    $or: [{ phoneNumber: norm.localPhone }, { phoneNumber: norm.target }],
  })
    .select("_id")
    .lean();

  if (exists) {
    return { ok: false, message: "Mobile number is already registered." };
  }

  return { ok: true };
};

// POST /sendEmailOtp
exports.sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(200).json({ status: false, message: "email is required." });
    }

    const availability = await ensureNotAlreadyRegistered("email", email);
    if (!availability.ok) {
      return res.status(200).json({ status: false, message: availability.message });
    }

    const result = await requestOtp({ channel: "email", email });
    if (!result.ok) {
      return res.status(200).json({ status: false, message: result.message });
    }

    return res.status(200).json({
      status: true,
      message: result.message,
      channel: result.channel,
      expiresInSec: result.expiresInSec,
      ...(result.devOtp ? { devOtp: result.devOtp } : {}),
    });
  } catch (error) {
    console.error("sendEmailOtp error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// POST /verifyEmailOtp
exports.verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {};

    if (!email || !otp) {
      return res.status(200).json({ status: false, message: "email and otp are required." });
    }

    const result = await confirmOtp({ channel: "email", email, otp });
    if (!result.ok) {
      return res.status(200).json({ status: false, message: result.message });
    }

    return res.status(200).json({
      status: true,
      message: result.message,
      channel: result.channel,
      verifiedUntil: result.verifiedUntil,
    });
  } catch (error) {
    console.error("verifyEmailOtp error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// POST /sendMobileOtp
exports.sendMobileOtp = async (req, res) => {
  try {
    const { phoneNumber, countryCode } = req.body || {};

    if (!phoneNumber) {
      return res.status(200).json({ status: false, message: "phoneNumber is required." });
    }

    if (!countryCode) {
      return res.status(200).json({ status: false, message: "countryCode is required (e.g. IN)." });
    }

    const availability = await ensureNotAlreadyRegistered("mobile", null, phoneNumber, countryCode);
    if (!availability.ok) {
      return res.status(200).json({ status: false, message: availability.message });
    }

    const result = await requestOtp({ channel: "mobile", phoneNumber, countryCode });
    if (!result.ok) {
      return res.status(200).json({ status: false, message: result.message });
    }

    return res.status(200).json({
      status: true,
      message: result.message,
      channel: result.channel,
      expiresInSec: result.expiresInSec,
      ...(result.devOtp ? { devOtp: result.devOtp } : {}),
    });
  } catch (error) {
    console.error("sendMobileOtp error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};

// POST /verifyMobileOtp
exports.verifyMobileOtp = async (req, res) => {
  try {
    const { phoneNumber, countryCode, otp } = req.body || {};

    if (!phoneNumber || !otp) {
      return res.status(200).json({ status: false, message: "phoneNumber and otp are required." });
    }

    if (!countryCode) {
      return res.status(200).json({ status: false, message: "countryCode is required (e.g. IN)." });
    }

    const result = await confirmOtp({ channel: "mobile", phoneNumber, countryCode, otp });
    if (!result.ok) {
      return res.status(200).json({ status: false, message: result.message });
    }

    return res.status(200).json({
      status: true,
      message: result.message,
      channel: result.channel,
      verifiedUntil: result.verifiedUntil,
    });
  } catch (error) {
    console.error("verifyMobileOtp error:", error);
    return res.status(500).json({ status: false, message: "Internal Server Error" });
  }
};
