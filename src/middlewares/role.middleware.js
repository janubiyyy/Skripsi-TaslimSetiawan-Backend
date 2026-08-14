/**
 * src/middlewares/role.middleware.js
 * Middleware untuk Role-Based Access Control (RBAC)
 *
 * Gunakan SETELAH middleware `authenticate`
 * Contoh: router.delete('/data/:id', authenticate, requireRole('admin'), controller)
 */

const { forbiddenResponse } = require('../utils/response');

/**
 * requireRole — Guard berbasis role
 * @param {...string} roles — Role yang diizinkan (misal: 'admin', 'viewer')
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return forbiddenResponse(res, 'Autentikasi diperlukan.');
    }

    if (!roles.includes(req.user.role)) {
      return forbiddenResponse(
        res,
        `Akses ditolak. Diperlukan role: ${roles.join(' atau ')}.`
      );
    }

    next();
  };
};

/**
 * requireAdmin — Shorthand untuk role admin saja
 */
const requireAdmin = requireRole('admin');

module.exports = { requireRole, requireAdmin };
