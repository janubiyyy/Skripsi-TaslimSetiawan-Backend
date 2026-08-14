/**
 * src/services/dataset.service.js
 * Business logic untuk manajemen dataset lalu lintas
 */

const { Op } = require('sequelize');
const { Dataset } = require('../models');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Get semua dataset dengan filter dan pagination
 */
const getAll = async ({ page = 1, limit = 50, gerbang, tahun, indeks_hari } = {}) => {
  const offset = (page - 1) * limit;
  const where = {};

  if (gerbang) where.gerbang = { [Op.like]: `%${gerbang}%` };
  if (tahun) where.tahun = parseInt(tahun);
  if (indeks_hari) where.indeks_hari = indeks_hari;

  const { count, rows } = await Dataset.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [['tanggal', 'ASC'], ['gerbang', 'ASC']],
  });

  return { data: rows, total: count, page, limit };
};

/**
 * Get satu dataset by ID
 */
const getById = async (id) => {
  const dataset = await Dataset.findByPk(id, {
    include: ['preprocessingResults'],
  });
  if (!dataset) throw new AppError('Dataset tidak ditemukan.', 404);
  return dataset;
};

/**
 * Bulk insert dari array parsed CSV
 * @param {Array<object>} rows — array baris CSV yang sudah di-parse
 */
const bulkInsert = async (rows) => {
  if (!rows || rows.length === 0) {
    throw new AppError('Tidak ada data untuk diimport.', 400);
  }

  const created = await Dataset.bulkCreate(rows, {
    validate: true,
    ignoreDuplicates: false,
  });

  return { inserted: created.length };
};

/**
 * Update 1 baris dataset by ID & pemicu ulang pipeline otomatis
 */
const updateById = async (id, data) => {
  const dataset = await Dataset.findByPk(id);
  if (!dataset) throw new AppError('Data tidak ditemukan.', 404);

  const gerbang = data.gerbang !== undefined ? String(data.gerbang).trim() : dataset.gerbang;
  const tahun = data.tahun !== undefined ? parseInt(data.tahun) : dataset.tahun;
  const indeks_hari = data.indeks_hari !== undefined ? (data.indeks_hari ? String(data.indeks_hari).trim().toUpperCase() : null) : dataset.indeks_hari;
  const v_masuk = data.volume_masuk !== undefined ? parseInt(data.volume_masuk) : (data.v_masuk !== undefined ? parseInt(data.v_masuk) : dataset.volume_masuk);
  const v_keluar = data.volume_keluar !== undefined ? parseInt(data.volume_keluar) : (data.v_keluar !== undefined ? parseInt(data.v_keluar) : dataset.volume_keluar);
  const v_total = v_masuk + v_keluar;
  const tanggal = data.tanggal !== undefined ? (data.tanggal || null) : dataset.tanggal;

  await dataset.update({
    gerbang,
    tahun,
    indeks_hari,
    volume_masuk: v_masuk,
    volume_keluar: v_keluar,
    volume_total: v_total,
    tanggal,
  });

  // Re-run pipeline otomatis (Scaling -> K-Means -> Time Series)
  try {
    const preprocessingService = require('./preprocessing.service');
    const kmeansService = require('./kmeans.service');
    const timeseriesService = require('./timeseries.service');

    await preprocessingService.runMinMaxScaling();
    await kmeansService.runClustering(3);
    await timeseriesService.generateAndSave();
  } catch (pipelineErr) {
    console.log('⚠️ Re-pipeline warning:', pipelineErr.message);
  }

  return { message: 'Data berhasil diperbarui.', data: dataset };
};

/**
 * Hapus 1 baris dataset by ID
 */
const deleteById = async (id) => {
  const dataset = await Dataset.findByPk(id);
  if (!dataset) throw new AppError('Data tidak ditemukan.', 404);
  await dataset.destroy();
  return { message: 'Data berhasil dihapus.' };
};

/**
 * Hapus semua data (reset total) — admin only
 */
const truncateAll = async () => {
  const { sequelize } = require('../config/database');
  const { Dataset, PreprocessingResult, KmeansCluster, TimeseriesResult, PreprocessingLog } = require('../models');

  const t = await sequelize.transaction();
  try {
    await PreprocessingResult.destroy({ where: {}, transaction: t });
    await KmeansCluster.destroy({ where: {}, transaction: t });
    await TimeseriesResult.destroy({ where: {}, transaction: t });
    await PreprocessingLog.destroy({ where: {}, transaction: t });
    await Dataset.destroy({ where: {}, transaction: t });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
  return { message: 'Semua data dataset dan hasil analisis berhasil dihapus.' };
};

/**
 * Get daftar gerbang unik
 */
const getGerbangList = async () => {
  const results = await Dataset.findAll({
    attributes: [[require('sequelize').fn('DISTINCT', require('sequelize').col('gerbang')), 'gerbang']],
    order: [['gerbang', 'ASC']],
    raw: true,
  });
  return results.map((r) => r.gerbang);
};

/**
 * Get daftar tahun unik
 */
const getTahunList = async () => {
  const results = await Dataset.findAll({
    attributes: [[require('sequelize').fn('DISTINCT', require('sequelize').col('tahun')), 'tahun']],
    order: [['tahun', 'ASC']],
    raw: true,
  });
  return results.map((r) => r.tahun);
};

module.exports = { getAll, getById, bulkInsert, updateById, deleteById, truncateAll, getGerbangList, getTahunList };
