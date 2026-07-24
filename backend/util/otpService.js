const bcrypt = require("bcrypt");
const OtpVerification = require("../models/otpVerification.model");
const { sendOtpMessage } = require("./otpSender");
const { detectIdentifier, normalizePhoneDigits, resolveDialCode } = require("./authIdentifier");

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000; // code valid 5 min
const VERIFIED_TTL_MS = 15 * 60 * 1000; // register window 15 min
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;
const BCRYPT_ROUNDS = 10;

const isDevMode = () => String(process.env.OTP_DEV_MODE || "").toLowerCase() === "true";

const generateOtp = () => {
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
};

const normalizeEmailTarget = (email) => {
  const detected = detectIdentifier(email);
  if (detected.type !== "email") {
    return { ok: false, message: detected.message || "Invalid email." };
  }
  return { ok: true, target: detected.value, countryCode: "" };
};

const normalizeMobileTarget = (phoneNumber, countryCode) => {
  const detected = detectIdentifier(phoneNumber);
  if (detected.type !== "mobile") {
    return { ok: false, message: detected.message || "Invalid mobile number." };
  }

  const iso = String(countryCode || "").trim().toUpperCase();
  if (!iso) {
    return { ok: false, message: "countryCode is required (e.g. IN)." };
  }

  const dial = resolveDialCode(iso);
  if (!dial) {
    return { ok: false, message: "Invalid countryCode. Use ISO code like IN." };
  }

  return {
    ok: true,
    target: `${dial}${detected.value}`,
    localPhone: detected.value,
    countryCode: iso,
  };
};

/**
 * Create + send OTP for email or mobile.
 */
const requestOtp = async ({ channel, email, phoneNumber, countryCode }) => {
  let normalized;

  if (channel === "email") {
    normalized = normalizeEmailTarget(email);
  } else if (channel === "mobile") {
    normalized = normalizeMobileTarget(phoneNumber, countryCode);
  } else {
    return { ok: false, message: "Invalid channel." };
  }

  if (!normalized.ok) {
    return normalized;
  }

  const existing = await OtpVerification.findOne({ channel, target: normalized.target }).sort({ createdAt: -1 });

  if (existing?.lastSentAt && Date.now() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt.getTime())) / 1000);
    return { ok: false, message: `Please wait ${waitSec}s before requesting another OTP.` };
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, BCRYPT_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Reset previous pending records for this target
  await OtpVerification.deleteMany({ channel, target: normalized.target });

  await OtpVerification.create({
    channel,
    target: normalized.target,
    countryCode: normalized.countryCode || "",
    otpHash,
    expiresAt,
    attempts: 0,
    isVerified: false,
    verifiedUntil: null,
    lastSentAt: new Date(),
  });

  const delivery = await sendOtpMessage({
    channel,
    target: channel === "email" ? normalized.target : normalized.localPhone || normalized.target,
    otp,
    countryCode: normalized.countryCode || "",
  });

  const result = {
    ok: true,
    message: `OTP sent successfully via ${delivery.provider}.`,
    channel,
    target: normalized.target,
    expiresInSec: Math.floor(OTP_TTL_MS / 1000),
    provider: delivery.provider,
  };

  // Dev helper for Postman — never enable in production
  if (isDevMode()) {
    result.devOtp = otp;
  }

  return result;
};

/**
 * Verify OTP and mark target verified for register window.
 */
const confirmOtp = async ({ channel, email, phoneNumber, countryCode, otp }) => {
  if (!otp || String(otp).trim().length !== OTP_LENGTH) {
    return { ok: false, message: `OTP must be ${OTP_LENGTH} digits.` };
  }

  let normalized;
  if (channel === "email") {
    normalized = normalizeEmailTarget(email);
  } else if (channel === "mobile") {
    normalized = normalizeMobileTarget(phoneNumber, countryCode);
  } else {
    return { ok: false, message: "Invalid channel." };
  }

  if (!normalized.ok) {
    return normalized;
  }

  const record = await OtpVerification.findOne({ channel, target: normalized.target }).sort({ createdAt: -1 });

  if (!record) {
    return { ok: false, message: "OTP not found. Please request a new OTP." };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return { ok: false, message: "Too many invalid attempts. Please request a new OTP." };
  }

  if (new Date() > record.expiresAt && !record.isVerified) {
    return { ok: false, message: "OTP expired. Please request a new OTP." };
  }

  // Already verified and still in register window
  if (record.isVerified && record.verifiedUntil && new Date() <= record.verifiedUntil) {
    return {
      ok: true,
      message: `${channel} already verified.`,
      channel,
      verifiedUntil: record.verifiedUntil,
    };
  }

  const match = await bcrypt.compare(String(otp).trim(), record.otpHash);
  if (!match) {
    record.attempts += 1;
    await record.save();
    return { ok: false, message: "Invalid OTP." };
  }

  record.isVerified = true;
  record.verifiedUntil = new Date(Date.now() + VERIFIED_TTL_MS);
  record.otpHash = ""; // one-time use
  await record.save();

  return {
    ok: true,
    message: `${channel} verified successfully.`,
    channel,
    verifiedUntil: record.verifiedUntil,
  };
};

/**
 * Check if email/mobile has a valid verification tick for register.
 */
const isTargetVerified = async (channel, target) => {
  const record = await OtpVerification.findOne({
    channel,
    target,
    isVerified: true,
    verifiedUntil: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .lean();

  return Boolean(record);
};

const assertEmailAndMobileVerified = async (email, phoneNumber, countryCode) => {
  const emailNorm = normalizeEmailTarget(email);
  if (!emailNorm.ok) {
    return { ok: false, message: emailNorm.message };
  }

  const mobileNorm = normalizeMobileTarget(phoneNumber, countryCode);
  if (!mobileNorm.ok) {
    return { ok: false, message: mobileNorm.message };
  }

  const [emailOk, mobileOk] = await Promise.all([
    isTargetVerified("email", emailNorm.target),
    isTargetVerified("mobile", mobileNorm.target),
  ]);

  if (!emailOk) {
    return { ok: false, message: "Email is not verified. Please verify email OTP first." };
  }

  if (!mobileOk) {
    return { ok: false, message: "Mobile is not verified. Please verify mobile OTP first." };
  }

  return { ok: true, emailTarget: emailNorm.target, mobileTarget: mobileNorm.target };
};

module.exports = {
  requestOtp,
  confirmOtp,
  assertEmailAndMobileVerified,
  normalizeEmailTarget,
  normalizeMobileTarget,
};
