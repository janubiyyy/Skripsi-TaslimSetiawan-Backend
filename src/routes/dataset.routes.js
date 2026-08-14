/**
 * src/routes/dataset.routes.js
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const datasetController = require('../controllers/dataset.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/role.middleware');

// ── Multer Setup (upload CSV) ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `dataset_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // Max 20MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Hanya file CSV yang diizinkan.'), false);
    }
  },
});

// ── Routes ──────────────────────────────────────────────────────────────────
// Semua route dataset butuh autentikasi
router.use(authenticate);

// Meta endpoints (sebelum /:id agar tidak konflik)
router.get('/meta/gerbang', datasetController.getGerbangList);
router.get('/meta/tahun', datasetController.getTahunList);

// CRUD
router.get('/', datasetController.getAll);
router.get('/:id', datasetController.getById);
router.post('/upload', requireAdmin, upload.single('file'), datasetController.uploadCSV);
router.put('/:id', requireAdmin, datasetController.updateById);
router.delete('/reset', requireAdmin, datasetController.resetAll);
router.delete('/:id', requireAdmin, datasetController.deleteById);

module.exports = router;
