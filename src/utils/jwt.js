/**
 * src/utils/jwt.js
 * Helper untuk sign dan verify JWT token
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'skripsi_lalin_secret_key_2026_super_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate access token
 * @param {object} payload — data yang di-encode ke token
 * @returns {string} JWT token
 */
const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'skripsi-lalin',
    audience: 'skripsi-client',
  });
};

/**
 * Verify dan decode token
 * @param {string} token
 * @returns {object} decoded payload
 * @throws {Error} jika token tidak valid atau expired
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'skripsi-lalin',
    audience: 'skripsi-client',
  });
};

/**
 * Decode token tanpa verifikasi (untuk debugging)
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = { signToken, verifyToken, decodeToken };
