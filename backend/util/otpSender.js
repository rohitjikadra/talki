/**
 * Provider-agnostic OTP delivery.
 * Current: console/dev only.
 * Later: plug Resend / SMTP / MSG91 / Twilio here without changing OTP APIs.
 */

const sendOtpMessage = async ({ channel, target, otp, countryCode }) => {
  // DEV / placeholder sender — replace this function body when provider is ready
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`[OTP:${channel.toUpperCase()}] target=${target} countryCode=${countryCode || "-"} otp=${otp}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  return {
    sent: true,
    provider: "console",
    message: `${channel} OTP logged to console (provider not configured yet).`,
  };
};

module.exports = {
  sendOtpMessage,
};
