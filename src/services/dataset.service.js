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
  const p = parseInt(page) || 1;
  const l = parseInt(limit) || 50;
  const offset = (p - 1) * l;

  // On Vercel serverless environment, use memoryStore for reliable data rendering
  if (process.env.VERCEL) {
    const memoryStore = require('../config/memoryStore');
    let storeData = memoryStore.datasets || [];

    if (gerbang) {
      storeData = storeData.filter((r) => r.gerbang && r.gerbang.toLowerCase().includes(gerbang.toLowerCase()));
    }
    if (tahun) {
      storeData = storeData.filter((r) => r.tahun === parseInt(tahun));
    }
    if (indeks_hari) {
      storeData = storeData.filter((r) => r.indeks_hari === indeks_hari);
    }

    const total = storeData.length;
    const data = storeData.slice(offset, offset + l);
    return { data, total, page: p, limit: l };
  }

  // Database query for local env
  const where = {};
  if (gerbang) where.gerbang = { [Op.like]: `%${gerbang}%` };
  if (tahun) where.tahun = parseInt(tahun);
  if (indeks_hari) where.indeks_hari = indeks_hari;

  let rows = [];
  let count = 0;
  try {
    const result = await Dataset.findAndCountAll({
      where,
      limit: l,
      offset,
      order: [['tanggal', 'ASC'], ['gerbang', 'ASC']],
    });
    rows = result.rows;
    count = result.count;
  } catch (err) {
    console.warn('Dataset DB query error:', err.message);
  }

  return { data: rows, total: count, page: p, limit: l };
};

/**
 * Get satu dataset by ID
 */
const getById = async (id) => {
  if (process.env.VERCEL) {
    const memoryStore = require('../config/memoryStore');
    const dataset = memoryStore.datasets.find((d) => d.id === parseInt(id));
    if (!dataset) throw new AppError('Dataset tidak ditemukan.', 404);
    return dataset;
  }
  const dataset = await Dataset.findByPk(id, {
    include: ['preprocessingResults'],
  });
  if (!dataset) throw new AppError('Dataset tidak ditemukan.', 404);
  return dataset;
};

/**
 * Bulk insert dari array parsed CSV
 */
const bulkInsert = async (rows) => {
  if (!rows || rows.length === 0) {
    throw new AppError('Tidak ada data untuk diimport.', 400);
  }
  if (process.env.VERCEL) {
    const memoryStore = require('../config/memoryStore');
    memoryStore.datasets = [...rows, ...memoryStore.datasets];
    return { insertedCount: rows.length };
  }
  const t = await sequelize.transaction();
  try {
    const created = await Dataset.bulkCreate(rows, { validate: true, transaction: t });
    await t.commit();
    return { insertedCount: created.length };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

/**
 * Update dataset by ID
 */
const updateById = async (id, data) => {
  if (process.env.VERCEL) {
    const memoryStore = require('../config/memoryStore');
    const idx = memoryStore.datasets.findIndex((d) => d.id === parseInt(id));
    if (idx !== -1) {
      memoryStore.datasets[idx] = { ...memoryStore.datasets[idx], ...data };
      return memoryStore.datasets[idx];
    }
    throw new AppError('Dataset tidak ditemukan.', 404);
  }
  const dataset = await Dataset.findByPk(id);
  if (!dataset) throw new AppError('Dataset tidak ditemukan.', 404);
  await dataset.update(data);
  return dataset;
};

/**
 * Delete dataset by ID
 */
const deleteById = async (id) => {
  if (process.env.VERCEL) {
    const memoryStore = require('../config/memoryStore');
    memoryStore.datasets = memoryStore.datasets.filter((d) => d.id !== parseInt(id));
    return { message: 'Dataset berhasil dihapus.' };
  }
  const dataset = await Dataset.findByPk(id);
  if (!dataset) throw new AppError('Dataset tidak ditemukan.', 404);
  await dataset.destroy();
  return { message: 'Dataset berhasil dihapus.' };
};

/**
 * Reset / truncate all datasets
 */
const truncateAll = async () => {
  if (process.env.VERCEL) {
    const memoryStore = require('../config/memoryStore');
    memoryStore.datasets = [];
    return { message: 'Semua data dataset berhasil dihapus.' };
  }
  await Dataset.destroy({ where: {} });
  return { message: 'Semua data dataset berhasil dihapus.' };
};

/**
 * Get daftar gerbang unik
 */
const getGerbangList = async () => {
  if (process.env.VERCEL) {
    const memoryStore = require('../config/memoryStore');
    const list = [...new Set(memoryStore.datasets.map((d) => d.gerbang).filter(Boolean))];
    return list.length > 0 ? list : ['GT Cikampek Utama 1', 'GT Cikampek Utama 2', 'GT Kalihurip Utama 1'];
  }
  try {
    const results = await Dataset.findAll({
      attributes: [[require('sequelize').fn('DISTINCT', require('sequelize').col('gerbang')), 'gerbang']],
      order: [['gerbang', 'ASC']],
      raw: true,
    });
    const list = results.map((r) => r.gerbang).filter(Boolean);
    return list.length > 0 ? list : ['GT Cikampek Utama 1', 'GT Cikampek Utama 2', 'GT Kalihurip Utama 1'];
  } catch (err) {
    return ['GT Cikampek Utama 1', 'GT Cikampek Utama 2', 'GT Kalihurip Utama 1'];
  }
};

/**
 * Get daftar tahun unik
 */
const getTahunList = async () => {
  if (process.env.VERCEL) {
    const memoryStore = require('../config/memoryStore');
    const list = [...new Set(memoryStore.datasets.map((d) => d.tahun).filter(Boolean))].sort();
    return list.length > 0 ? list : [2020, 2021, 2022, 2023, 2024];
  }
  try {
    const results = await Dataset.findAll({
      attributes: [[require('sequelize').fn('DISTINCT', require('sequelize').col('tahun')), 'tahun']],
      order: [['tahun', 'ASC']],
      raw: true,
    });
    const list = results.map((r) => r.tahun).filter(Boolean);
    return list.length > 0 ? list : [2020, 2021, 2022, 2023, 2024];
  } catch (err) {
    return [2020, 2021, 2022, 2023, 2024];
  }
};

module.exports = { getAll, getById, bulkInsert, updateById, deleteById, truncateAll, getGerbangList, getTahunList };
