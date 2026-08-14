/**
 * src/controllers/kmeans.controller.js
 * HTTP layer untuk K-Means Clustering
 */

const { body, query, param, validationResult } = require('express-validator');
const kmeansService = require('../services/kmeans.service');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * POST /api/kmeans/run
 * Body: { k: number } — default K=3
 */
const runClustering = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, { message: 'Input tidak valid.', statusCode: 422, errors: errors.array() });
    }

    const k = parseInt(req.body.k) || 3;
    const result = await kmeansService.runClustering(k);

    return successResponse(res, {
      message: `K-Means Clustering (K=${k}) berhasil. Konvergen dalam ${result.iterations} iterasi.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/kmeans/results?k=3
 * Hasil clustering lengkap: scatter plot, distribusi, evaluasi
 */
const getResults = async (req, res, next) => {
  try {
    const k = parseInt(req.query.k) || 3;
    const { tahun, gerbang } = req.query;
    const data = await kmeansService.getResults(k, { tahun, gerbang });
    return successResponse(res, {
      message: `Data hasil clustering K=${k} berhasil diambil.`,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/kmeans/elbow?k_min=2&k_max=8
 * Elbow Method untuk membantu menentukan nilai K optimal
 */
const getElbow = async (req, res, next) => {
  try {
    const kMin = parseInt(req.query.k_min) || 2;
    const kMax = parseInt(req.query.k_max) || 8;

    if (kMin >= kMax || kMin < 2 || kMax > 15) {
      return errorResponse(res, { message: 'k_min harus ≥ 2 dan k_max ≤ 15 dan k_min < k_max.', statusCode: 400 });
    }

    const data = await kmeansService.runElbowMethod(kMin, kMax);
    return successResponse(res, {
      message: `Elbow Method untuk K=${kMin} s.d. K=${kMax} berhasil dihitung.`,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/kmeans/available-k
 */
const getAvailableK = async (req, res, next) => {
  try {
    const data = await kmeansService.getAvailableK();
    return successResponse(res, { message: 'Daftar K tersedia.', data });
  } catch (error) {
    next(error);
  }
};

// Validation rules
const validateRun = [
  body('k')
    .optional()
    .isInt({ min: 2, max: 20 }).withMessage('K harus integer antara 2 dan 20.')
    .toInt(),
];

module.exports = { runClustering, getResults, getElbow, getAvailableK, validateRun };
