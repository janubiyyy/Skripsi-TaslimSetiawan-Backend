/**
 * src/routes/auth.routes.js
 */

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Validation rules
const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username wajib diisi.'),
  body('password').notEmpty().withMessage('Password wajib diisi.'),
];

const changePasswordValidation = [
  body('oldPassword').notEmpty().withMessage('Password lama wajib diisi.'),
  body('newPassword')
    .notEmpty().withMessage('Password baru wajib diisi.')
    .isLength({ min: 8 }).withMessage('Password baru minimal 8 karakter.'),
];

// ── Routes ──────────────────────────────────────────────────────────────────
router.post('/login', loginValidation, authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.patch('/change-password', authenticate, changePasswordValidation, authController.changePassword);

module.exports = router;
