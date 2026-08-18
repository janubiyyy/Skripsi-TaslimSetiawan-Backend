/**
 * src/controllers/preprocessing.controller.js
 * HTTP layer untuk modul preprocessing (import Excel + Min-Max Scaling)
 */

const multer = require('multer');
const path = require('path');
const preprocessingService = require('../services/preprocessing.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// ── Multer Upload Config (Memory Storage for Vercel/Cloud Serverless) ─────
const storage = multer.memoryStorage();


const ALLOWED_MIMETYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'text/csv',
  'application/csv',
];

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Max 50MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext) || ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file Excel (.xlsx, .xls) atau CSV yang diizinkan.'), false);
    }
  },
}).single('file');

// Export multer sebagai middleware (dipasang di route)
const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return errorResponse(res, { message: `Upload error: ${err.message}`, statusCode: 400 });
    }
    if (err) {
      return errorResponse(res, { message: err.message, statusCode: 400 });
    }
    next();
  });
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/preprocessing/import
 * Upload & import file Excel/CSV ke database
 */
const importFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, { message: 'Tidak ada file yang diupload. Sertakan file dengan key "file".', statusCode: 400 });
    }

    const result = await preprocessingService.importFile(req.file);

    return successResponse(res, {
      message: `Import berhasil! ${result.summary.berhasil_diimport} baris data berhasil dimasukkan.`,
      data: result,
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/preprocessing/scale
 * Jalankan Min-Max Scaling pada semua data dataset
 */
const runScaling = async (req, res, next) => {
  try {
    const result = await preprocessingService.runMinMaxScaling();
    return successResponse(res, {
      message: `Min-Max Scaling selesai. ${result.jumlah_data_diproses} data berhasil dinormalisasi.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/preprocessing/results
 * Ambil semua hasil preprocessing (data scaled) dengan paginasi
 */
const getResults = async (req, res, next) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const result = await preprocessingService.getAll({ page, limit });
    return paginatedResponse(res, { ...result, message: 'Data preprocessing berhasil diambil.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/preprocessing/logs
 * Riwayat import file
 */
const getLogs = async (req, res, next) => {
  try {
    const data = await preprocessingService.getLogs();
    return successResponse(res, { message: 'Log import berhasil diambil.', data });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/preprocessing/stats
 * Statistik overview dataset (untuk dashboard summary card)
 */
const getStats = async (req, res, next) => {
  try {
    const data = await preprocessingService.getStats();
    return successResponse(res, { message: 'Statistik dataset berhasil diambil.', data });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadMiddleware, importFile, runScaling, getResults, getLogs, getStats };
