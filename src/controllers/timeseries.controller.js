/**
 * src/controllers/timeseries.controller.js
 * HTTP layer untuk modul Time Series & Evaluasi MAPE
 */

const { body, validationResult } = require('express-validator');
const timeseriesService = require('../services/timeseries.service');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * POST /api/timeseries/generate
 * Generate dan simpan data time series dari dataset ke DB
 * Harus dijalankan setelah import data
 */
const generate = async (req, res, next) => {
  try {
    const result = await timeseriesService.generateAndSave();
    return successResponse(res, {
      message: `Data time series berhasil digenerate. ${result.records_saved} record tersimpan.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/timeseries/summary?gerbang=xxx&metric=masuk
 * Summary lengkap: tren harian, YoY, MAPE, chart data
 */
const getSummary = async (req, res, next) => {
  try {
    const { gerbang, tahun, metric = 'masuk' } = req.query;

    if (!['masuk', 'keluar', 'total'].includes(metric)) {
      return errorResponse(res, { message: 'metric harus salah satu dari: masuk, keluar, total.', statusCode: 400 });
    }

    const data = await timeseriesService.getSummary({ gerbang, tahun, metric });
    return successResponse(res, {
      message: 'Data time series summary berhasil diambil.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/timeseries/yoy?gerbang=xxx&indeks_hari=H
 * Year-on-Year comparison (lightweight)
 */
const getYoY = async (req, res, next) => {
  try {
    const { gerbang, indeks_hari } = req.query;
    const data = await timeseriesService.getYoYComparison({ gerbang, indeks_hari });
    return successResponse(res, {
      message: 'Data Year-on-Year berhasil diambil.',
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/timeseries/mape
 * Hitung MAPE manual dari array actuals & forecasts
 * Body: { actuals: number[], forecasts: number[] }
 */
const calculateMAPE = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, { message: 'Input tidak valid.', statusCode: 422, errors: errors.array() });
    }

    const { actuals, forecasts } = req.body;
    const result = timeseriesService.calculateMAPEManual({ actuals, forecasts });
    return successResponse(res, {
      message: 'Kalkulasi MAPE berhasil.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Validation rules
const validateMAPE = [
  body('actuals')
    .isArray({ min: 1 }).withMessage('actuals harus berupa array dengan minimal 1 elemen.')
    .custom((arr) => arr.every((v) => typeof v === 'number')).withMessage('Semua elemen actuals harus berupa angka.'),
  body('forecasts')
    .isArray({ min: 1 }).withMessage('forecasts harus berupa array dengan minimal 1 elemen.')
    .custom((arr) => arr.every((v) => typeof v === 'number')).withMessage('Semua elemen forecasts harus berupa angka.'),
];

module.exports = { generate, getSummary, getYoY, calculateMAPE, validateMAPE };
