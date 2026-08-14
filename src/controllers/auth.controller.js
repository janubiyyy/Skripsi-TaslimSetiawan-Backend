/**
 * src/controllers/auth.controller.js
 * HTTP layer untuk autentikasi
 */

const { validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, {
        message: 'Input tidak valid.',
        statusCode: 422,
        errors: errors.array(),
      });
    }

    const { username, password } = req.body;
    const { user, token } = await authService.login(username, password);

    return successResponse(res, {
      message: 'Login berhasil.',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me — Profile user yang sedang login
 */
const getMe = async (req, res, next) => {
  try {
    return successResponse(res, {
      message: 'Data user berhasil diambil.',
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout — (Stateless: cukup hapus token di client)
 */
const logout = async (req, res) => {
  return successResponse(res, {
    message: 'Logout berhasil. Hapus token di sisi client.',
    data: null,
  });
};

/**
 * PATCH /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, {
        message: 'Input tidak valid.',
        statusCode: 422,
        errors: errors.array(),
      });
    }

    const { oldPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
    return successResponse(res, { message: result.message, data: null });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe, logout, changePassword };
