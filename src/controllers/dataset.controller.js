/**
 * src/controllers/dataset.controller.js
 * HTTP layer untuk manajemen dataset CSV
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const datasetService = require('../services/dataset.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

/**
 * GET /api/datasets — List semua dataset (paginated)
 */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, gerbang, tahun, indeks_hari } = req.query;
    const result = await datasetService.getAll({ page, limit, gerbang, tahun, indeks_hari });
    return paginatedResponse(res, { ...result, message: 'Data berhasil diambil.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/datasets/:id — Detail satu data
 */
const getById = async (req, res, next) => {
  try {
    const data = await datasetService.getById(req.params.id);
    return successResponse(res, { data, message: 'Data ditemukan.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/datasets/upload — Upload CSV file
 * Menggunakan multer (dipasang di route level)
 */
const uploadCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, { message: 'File CSV tidak ditemukan.', statusCode: 400 });
    }

    // Parse CSV
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    let records;
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseErr) {
      fs.unlinkSync(req.file.path);
      return errorResponse(res, { message: `Format CSV tidak valid: ${parseErr.message}`, statusCode: 422 });
    }

    // Map CSV columns ke model fields
    // CSV header: id,gerbang,tahun,indeks_hari,v_masuk,v_keluar,v_total,tanggal,hari,urutan_hari
    const rows = records.map((row) => ({
      gerbang: row.gerbang || '',
      tahun: parseInt(row.tahun) || new Date().getFullYear(),
      indeks_hari: row.indeks_hari || null,
      volume_masuk: parseInt(row.v_masuk) || 0,
      volume_keluar: parseInt(row.v_keluar) || 0,
      volume_total: parseInt(row.v_total) || 0,
      tanggal: row.tanggal || null,
      hari: row.hari || null,
      urutan_hari: row.urutan_hari ? parseInt(row.urutan_hari) : null,
    }));

    // Hapus file temp
    fs.unlinkSync(req.file.path);

    const result = await datasetService.bulkInsert(rows);
    return successResponse(res, {
      message: `Berhasil mengimport ${result.inserted} baris data.`,
      data: result,
      statusCode: 201,
    });
  } catch (error) {
    // Pastikan file temp dihapus walau error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * DELETE /api/datasets/reset — Hapus semua data (admin only)
 */
const resetAll = async (req, res, next) => {
  try {
    const result = await datasetService.truncateAll();
    return successResponse(res, { message: result.message, data: null });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/datasets/:id — Edit 1 baris dataset (admin only)
 */
const updateById = async (req, res, next) => {
  try {
    const result = await datasetService.updateById(req.params.id, req.body);
    return successResponse(res, { message: result.message, data: result.data });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/datasets/:id — Hapus 1 baris (admin only)
 */
const deleteById = async (req, res, next) => {
  try {
    const result = await datasetService.deleteById(req.params.id);
    return successResponse(res, { message: result.message, data: null });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/datasets/meta/gerbang — Daftar gerbang unik
 */
const getGerbangList = async (req, res, next) => {
  try {
    const data = await datasetService.getGerbangList();
    return successResponse(res, { data, message: 'Daftar gerbang berhasil diambil.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/datasets/meta/tahun — Daftar tahun unik
 */
const getTahunList = async (req, res, next) => {
  try {
    const data = await datasetService.getTahunList();
    return successResponse(res, { data, message: 'Daftar tahun berhasil diambil.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, uploadCSV, updateById, deleteById, resetAll, getGerbangList, getTahunList };
