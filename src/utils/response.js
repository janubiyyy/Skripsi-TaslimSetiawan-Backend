/**
 * src/utils/response.js
 * Helper untuk format API response yang konsisten
 */

/**
 * Response sukses
 * @param {import('express').Response} res
 * @param {object} options
 */
const successResponse = (res, { data = null, message = 'Berhasil', statusCode = 200, meta = null } = {}) => {
  const payload = {
    status: 'success',
    message,
    data,
  };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

/**
 * Response error (client error, 4xx)
 */
const errorResponse = (res, { message = 'Terjadi kesalahan', statusCode = 400, errors = null } = {}) => {
  const payload = {
    status: 'error',
    message,
  };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

/**
 * Response 401 Unauthorized
 */
const unauthorizedResponse = (res, message = 'Akses tidak diizinkan. Silakan login.') => {
  return res.status(401).json({ status: 'error', message });
};

/**
 * Response 403 Forbidden
 */
const forbiddenResponse = (res, message = 'Anda tidak memiliki izin untuk aksi ini.') => {
  return res.status(403).json({ status: 'error', message });
};

/**
 * Response 404 Not Found
 */
const notFoundResponse = (res, message = 'Data tidak ditemukan.') => {
  return res.status(404).json({ status: 'error', message });
};

/**
 * Response paginasi
 */
const paginatedResponse = (res, { data, total, page, limit, message = 'Berhasil' } = {}) => {
  return res.status(200).json({
    status: 'success',
    message,
    data,
    meta: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  });
};

module.exports = {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  paginatedResponse,
};
