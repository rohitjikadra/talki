const mongoose = require("mongoose");

/**
 * Temporary OTP + verification ticks for email/mobile (pre-register).
 * Provider-agnostic: actual SMS/email send is handled outside this model.
 */
const otpVerificationSchema = new mongoose.Schema(
  {
    // "email" | "mobile"
    channel: { type: String, enum: ["email", "mobile"], required: true },

    // Normalized target: email lowercase OR dial+phone digits (e.g. 919876543210)
    target: { type: String, required: true, index: true },

    // ISO country for mobile (e.g. IN) — empty for email
    countryCode: { type: String, default: "" },

    otpHash: { type: String, default: "" },

    // OTP code validity (e.g. 5 minutes)
    expiresAt: { type: Date, required: true },

    attempts: { type: Number, default: 0 },

    // After successful verify — used by register API (e.g. valid 15 minutes)
    isVerified: { type: Boolean, default: false },
    verifiedUntil: { type: Date, default: null },

    lastSentAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

otpVerificationSchema.index({ channel: 1, target: 1 });

module.exports = mongoose.model("OtpVerification", otpVerificationSchema);
