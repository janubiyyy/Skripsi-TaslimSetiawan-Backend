/**
 * src/middlewares/auth.middleware.js
 * Middleware verifikasi JWT token dari header Authorization
 */

const { verifyToken } = require('../utils/jwt');
const { unauthorizedResponse } = require('../utils/response');
const { User } = require('../models');

/**
 * authenticate — Verifikasi token JWT dan attach user ke req
 * Penggunaan: router.get('/protected', authenticate, controller)
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'Token tidak ditemukan. Silakan login.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Cek apakah user masih ada di database
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return unauthorizedResponse(res, 'Akun tidak ditemukan atau sudah dihapus.');
    }

    // Attach user ke request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return unauthorizedResponse(res, 'Token sudah kedaluwarsa. Silakan login kembali.');
    }
    if (error.name === 'JsonWebTokenError') {
      return unauthorizedResponse(res, 'Token tidak valid.');
    }
    next(error);
  }
};

module.exports = { authenticate };
