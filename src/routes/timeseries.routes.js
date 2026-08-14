/**
 * src/routes/timeseries.routes.js
 * Route untuk modul Time Series & Evaluasi MAPE
 */

const express = require('express');
const router = express.Router();

const timeseriesController = require('../controllers/timeseries.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/role.middleware');

router.use(authenticate);

// ── GET: Baca data (semua role) ────────────────────────────────────────────
router.get('/summary', timeseriesController.getSummary);    // ?gerbang=xxx&metric=masuk
router.get('/yoy', timeseriesController.getYoY);             // ?gerbang=xxx&indeks_hari=H

// ── POST: Generate + Kalkulasi (admin / semua role) ───────────────────────
router.post('/generate', requireAdmin, timeseriesController.generate);
router.post('/mape', timeseriesController.validateMAPE, timeseriesController.calculateMAPE);

module.exports = router;
