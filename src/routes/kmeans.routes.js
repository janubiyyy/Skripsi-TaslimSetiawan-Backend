/**
 * src/routes/kmeans.routes.js
 * Route untuk modul K-Means Clustering
 */

const express = require('express');
const router = express.Router();

const kmeansController = require('../controllers/kmeans.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/role.middleware');

router.use(authenticate);

// ── GET: Baca hasil (semua role) ───────────────────────────────────────────
router.get('/results', kmeansController.getResults);         // ?k=3
router.get('/elbow', kmeansController.getElbow);             // ?k_min=2&k_max=8
router.get('/available-k', kmeansController.getAvailableK);

// ── POST: Jalankan K-Means (admin only) ───────────────────────────────────
router.post('/run', requireAdmin, kmeansController.validateRun, kmeansController.runClustering);

module.exports = router;
