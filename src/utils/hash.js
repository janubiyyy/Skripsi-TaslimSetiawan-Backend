/**
 * src/utils/hash.js
 * Helper bcrypt untuk hashing dan verifikasi password
 */

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

/**
 * Hash plain text password
 * @param {string} password
 * @returns {Promise<string>}
 */
const hashPassword = (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Bandingkan plain text dengan hash
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const comparePassword = (password, hash) => {
  return bcrypt.compare(password, hash);
};

module.exports = { hashPassword, comparePassword };
