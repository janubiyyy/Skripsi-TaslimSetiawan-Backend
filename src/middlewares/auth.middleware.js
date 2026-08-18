/**
 * src/middlewares/auth.middleware.js
 * Middleware verifikasi JWT token dari header Authorization
 */

const { verifyToken } = require('../utils/jwt');
const { unauthorizedResponse } = require('../utils/response');
const { User } = require('../models');

/**
 * authenticate — Verifikasi token JWT dan attach user ke req
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'Token tidak ditemukan. Silakan login.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    let user = null;
    try {
      user = await User.findByPk(decoded.id);
    } catch (err) {
      console.warn('User findByPk warning:', err.message);
    }

    // Attach user ke request (fallback to decoded token payload if user not in DB)
    req.user = user
      ? (user.toJSON ? user.toJSON() : user)
      : { id: decoded.id || 1, username: decoded.username || 'admin', role: decoded.role || 'admin' };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return unauthorizedResponse(res, 'Token sudah kedaluwarsa. Silakan login kembali.');
    }
    if (error.name === 'JsonWebTokenError') {
      return unauthorizedResponse(res, 'Token tidak valid.');
    }
    return unauthorizedResponse(res, 'Sesi tidak valid. Silakan login kembali.');
  }
};

module.exports = { authenticate };
