/**
 * src/routes/preprocessing.routes.js
 * Route untuk modul preprocessing: import Excel/CSV + Min-Max Scaling
 */

const express = require('express');
const router = express.Router();

const preprocessingController = require('../controllers/preprocessing.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/role.middleware');

// Semua route preprocessing butuh autentikasi
router.use(authenticate);

// ── GET: Baca data (semua role) ────────────────────────────────────────────
router.get('/results', preprocessingController.getResults);
router.get('/logs', preprocessingController.getLogs);
router.get('/stats', preprocessingController.getStats);

// ── POST: Aksi (admin only) ────────────────────────────────────────────────
// Upload & import file Excel/CSV
router.post(
  '/import',
  requireAdmin,
  preprocessingController.uploadMiddleware,
  preprocessingController.importFile
);

// Jalankan Min-Max Scaling
router.post('/scale', requireAdmin, preprocessingController.runScaling);

module.exports = router;
