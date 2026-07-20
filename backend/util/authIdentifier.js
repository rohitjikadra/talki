/**
 * Auto-detect whether identifier is email or mobile.
 * Client should NOT send loginType for this flow.
 *
 * countryCode format: ISO like "IN" (NOT "+91")
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ISO country code → dialing code digits (extend as needed)
const ISO_TO_DIAL = {
  IN: "91",
  US: "1",
  CA: "1",
  GB: "44",
  AE: "971",
  SA: "966",
  PK: "92",
  BD: "880",
  NP: "977",
  LK: "94",
  AU: "61",
  SG: "65",
};

const normalizePhoneDigits = (value = "") => String(value).replace(/\D/g, "");

/**
 * Resolve dial digits from ISO country code ("IN") or raw dial ("+91" / "91").
 */
const resolveDialCode = (countryCode = "") => {
  const raw = String(countryCode || "").trim().toUpperCase();
  if (!raw) return "";

  if (ISO_TO_DIAL[raw]) {
    return ISO_TO_DIAL[raw];
  }

  // Fallback: if client still sends +91 / 91
  return normalizePhoneDigits(raw);
};

/**
 * @param {string} identifier - email or mobile (with/without country code digits)
 * @returns {{ type: "email"|"mobile"|null, value: string, message?: string }}
 */
const detectIdentifier = (identifier) => {
  const raw = String(identifier || "").trim();

  if (!raw) {
    return { type: null, value: "", message: "identifier is required (email or mobile)." };
  }

  if (raw.includes("@") || EMAIL_REGEX.test(raw)) {
    if (!EMAIL_REGEX.test(raw)) {
      return { type: null, value: raw, message: "Invalid email format." };
    }
    return { type: "email", value: raw.toLowerCase() };
  }

  const digits = normalizePhoneDigits(raw);
  if (digits.length >= 8 && digits.length <= 15) {
    return { type: "mobile", value: digits };
  }

  return {
    type: null,
    value: raw,
    message: "Invalid identifier. Use a valid email or mobile number.",
  };
};

/**
 * Build E.164-ish phone for Firebase token compare.
 * Example: countryCode "IN", phone "9876543210" → "+919876543210"
 */
const toE164 = (countryCode = "", phoneNumber = "") => {
  const dialDigits = resolveDialCode(countryCode);
  const phoneDigits = normalizePhoneDigits(phoneNumber);
  if (!phoneDigits) return "";

  // Phone already includes dial code
  if (dialDigits && phoneDigits.startsWith(dialDigits) && phoneDigits.length > dialDigits.length) {
    return `+${phoneDigits}`;
  }

  return dialDigits ? `+${dialDigits}${phoneDigits}` : `+${phoneDigits}`;
};

/**
 * Compare request phone with Firebase token phone_number.
 * countryCode should be ISO like "IN".
 */
const isSamePhone = (tokenPhone = "", countryCode = "", phoneNumber = "") => {
  const tokenDigits = normalizePhoneDigits(tokenPhone);
  if (!tokenDigits) return false;

  const requestE164Digits = normalizePhoneDigits(toE164(countryCode, phoneNumber));
  const requestPhoneDigits = normalizePhoneDigits(phoneNumber);

  return tokenDigits === requestE164Digits || tokenDigits === requestPhoneDigits || tokenDigits.endsWith(requestPhoneDigits);
};

module.exports = {
  detectIdentifier,
  normalizePhoneDigits,
  resolveDialCode,
  toE164,
  isSamePhone,
  ISO_TO_DIAL,
};
