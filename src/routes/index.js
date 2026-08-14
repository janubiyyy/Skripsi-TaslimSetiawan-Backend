/**
 * src/routes/index.js — Agregator semua routes API
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const datasetRoutes = require('./dataset.routes');
const preprocessingRoutes = require('./preprocessing.routes');
const kmeansRoutes = require('./kmeans.routes');
const timeseriesRoutes = require('./timeseries.routes');

// ── Mount Routes ──────────────────────────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/datasets', datasetRoutes);
router.use('/preprocessing', preprocessingRoutes);
router.use('/kmeans', kmeansRoutes);
router.use('/timeseries', timeseriesRoutes);

// ── API Info ──────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    title: 'Skripsi — Analisis Pola Lalu Lintas Lebaran API',
    description: 'K-Means Clustering & Time Series untuk data lalu lintas Lebaran 2016-2026',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout',
        change_password: 'PATCH /api/auth/change-password',
      },
      datasets: {
        list: 'GET /api/datasets',
        detail: 'GET /api/datasets/:id',
        meta_gerbang: 'GET /api/datasets/meta/gerbang',
        meta_tahun: 'GET /api/datasets/meta/tahun',
      },
      preprocessing: {
        import_excel: 'POST /api/preprocessing/import [multipart/form-data, field: file]',
        run_scaling: 'POST /api/preprocessing/scale',
        results: 'GET /api/preprocessing/results',
        logs: 'GET /api/preprocessing/logs',
        stats: 'GET /api/preprocessing/stats',
      },
      kmeans: {
        run: 'POST /api/kmeans/run [body: { k: 3 }]',
        results: 'GET /api/kmeans/results?k=3',
        elbow: 'GET /api/kmeans/elbow?k_min=2&k_max=8',
        available_k: 'GET /api/kmeans/available-k',
      },
      timeseries: {
        generate: 'POST /api/timeseries/generate',
        summary: 'GET /api/timeseries/summary?gerbang=&metric=masuk',
        yoy: 'GET /api/timeseries/yoy?gerbang=&indeks_hari=H',
        mape: 'POST /api/timeseries/mape [body: { actuals: [], forecasts: [] }]',
      },
    },
    workflow: [
      '1. POST /api/auth/login → dapatkan token JWT',
      '2. POST /api/preprocessing/import → upload file Excel/CSV',
      '3. POST /api/preprocessing/scale → jalankan Min-Max Scaling',
      '4. POST /api/kmeans/run → jalankan K-Means (K=3)',
      '5. GET /api/kmeans/results?k=3 → ambil hasil clustering + scatter plot',
      '6. POST /api/timeseries/generate → generate data tren harian',
      '7. GET /api/timeseries/summary → tren H-7 s.d. H+7 + MAPE + YoY',
    ],
  });
});

module.exports = router;
