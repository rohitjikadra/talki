const bcrypt = require("bcrypt");

// TEMP: keep Cryptr only for legacy password migration (old encrypted passwords)
const Cryptr = require("cryptr");
const cryptr = new Cryptr("myTotallySecretKey");

const BCRYPT_SALT_ROUNDS = 10;

const isBcryptHash = (value = "") => typeof value === "string" && /^\$2[aby]\$/.test(value);

const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
};

/**
 * Verify password against stored value.
 * Supports:
 * 1) bcrypt hash (new)
 * 2) Cryptr encrypted password (legacy) — on match, returns needsRehash:true so caller can migrate
 */
const verifyPassword = async (plainPassword, storedPassword) => {
  if (!plainPassword || !storedPassword) {
    return { match: false, needsRehash: false };
  }

  if (isBcryptHash(storedPassword)) {
    const match = await bcrypt.compare(plainPassword, storedPassword);
    return { match, needsRehash: false };
  }

  // Legacy Cryptr password support (temporary migration path)
  try {
    const decrypted = cryptr.decrypt(storedPassword);
    const match = decrypted === plainPassword;
    return { match, needsRehash: match };
  } catch (error) {
    return { match: false, needsRehash: false };
  }
};

module.exports = {
  hashPassword,
  verifyPassword,
  isBcryptHash,
};
