/**
 * src/middlewares/errorHandler.js
 * Global error handler — harus dipasang TERAKHIR di app.js
 *
 * Menangani berbagai jenis error secara terpusat:
 * - Sequelize errors (validation, unique constraint, connection)
 * - JWT errors
 * - Validation errors (express-validator)
 * - Generic errors
 */

const { ValidationError, UniqueConstraintError, ConnectionError } = require('sequelize');

const errorHandler = (err, req, res, _next) => {
  // Log error di console (development)
  if (process.env.NODE_ENV === 'development') {
    console.error(`\n❌ [Error Handler] ${new Date().toISOString()}`);
    console.error(`   Route: ${req.method} ${req.originalUrl}`);
    console.error(`   Message: ${err.message}`);
    console.error(`   Stack: ${err.stack}\n`);
  }

  // ── Sequelize Validation Error ──────────────────────────────────────────
  if (err instanceof ValidationError) {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(422).json({
      status: 'error',
      message: 'Data tidak valid.',
      errors,
    });
  }

  // ── Sequelize Unique Constraint Error ───────────────────────────────────
  if (err instanceof UniqueConstraintError) {
    const fields = err.errors.map((e) => e.path).join(', ');
    return res.status(409).json({
      status: 'error',
      message: `Data sudah ada (duplikat): ${fields}`,
    });
  }

  // ── Sequelize Connection Error ──────────────────────────────────────────
  if (err instanceof ConnectionError) {
    return res.status(503).json({
      status: 'error',
      message: 'Database tidak dapat dijangkau. Coba lagi nanti.',
    });
  }

  // ── JWT Errors (jika tidak ditangani di middleware) ─────────────────────
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ status: 'error', message: 'Token sudah kedaluwarsa.' });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ status: 'error', message: 'Token tidak valid.' });
  }

  // ── Multer (upload file) ────────────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ status: 'error', message: 'Ukuran file terlalu besar.' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ status: 'error', message: 'Field file tidak diizinkan.' });
  }

  // ── Custom App Error (dengan statusCode) ────────────────────────────────
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // ── Generic Server Error ────────────────────────────────────────────────
  return res.status(500).json({
    status: 'error',
    message: err.message || 'Terjadi kesalahan pada server. Coba lagi nanti.',
  });
};

/**
 * Custom Error class dengan statusCode
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = errorHandler;
module.exports.AppError = AppError;
