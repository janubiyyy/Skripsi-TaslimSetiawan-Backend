/**
 * src/middlewares/errorHandler.js — Clear error diagnostic handler
 */

const errorHandler = (err, req, res, _next) => {
  console.error(`❌ [Error Handler] ${req.method} ${req.originalUrl}:`, err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    status: 'error',
    message: message,
    error: err.toString(),
    stack: err.stack,
  });
};

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
