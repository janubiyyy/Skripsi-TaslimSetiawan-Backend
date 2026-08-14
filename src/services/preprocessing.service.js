/**
 * src/services/preprocessing.service.js
 *
 * Modul Preprocessing Lengkap:
 * 1. Import data dari Excel (.xlsx/.xls) atau CSV
 * 2. Penanganan missing value & duplikat
 * 3. Penyelarasan Indeks Hari (H-7 s.d. H+7)
 * 4. Normalisasi Min-Max Scaling (0–1) untuk v_masuk & v_keluar
 * 5. Simpan rumus dan hasil ke database
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { Op } = require('sequelize');
const { Dataset, PreprocessingResult, PreprocessingLog } = require('../models');
const { sequelize } = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

// ─────────────────────────────────────────────────────────────────────────────
// KONSTANTA: Mapping indeks hari yang valid dan urutan numericnya
// ─────────────────────────────────────────────────────────────────────────────
const INDEKS_HARI_ORDER = {
  'H-7': -7, 'H-6': -6, 'H-5': -5, 'H-4': -4, 'H-3': -3,
  'H-2': -2, 'H-1': -1, 'H': 0, 'H+1': 1, 'H+2': 2,
  'H+3': 3, 'H+4': 4, 'H+5': 5, 'H+6': 6, 'H+7': 7,
};

const VALID_INDEKS = Object.keys(INDEKS_HARI_ORDER);

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalisasi string indeks hari dari berbagai format input
 * Contoh: "H - 7" → "H-7", "h+1" → "H+1", "hari raya" → "H"
 */
const normalizeIndeksHari = (raw) => {
  if (raw === null || raw === undefined || raw === '') return null;
  let s = String(raw).trim().toUpperCase();

  // Variasi Hari H
  if (
    s === 'H' || s === 'H0' || s === 'H-0' || s === 'H+0' || s === '0' || s === '0.0' ||
    s.includes('HARI H') || s.includes('HARI-H') || s.includes('HARI_H') ||
    s.includes('HARI RAYA') || s.includes('LEBARAN') || s.includes('IDUL FITRI') || s.includes('HARIH')
  ) {
    return 'H';
  }

  const clean = s.replace(/\s+/g, '');
  if (VALID_INDEKS.includes(clean)) return clean;

  // Handle H-01 s.d H-07, H+01 s.d H+07
  const match = clean.match(/^H([+-])0*(\d+)$/);
  if (match) {
    const num = parseInt(match[2]);
    if (num <= 7) return `H${match[1]}${num}`;
  }

  // Handle number only (-7 s.d. 7)
  const numOnly = parseInt(clean.replace(/[^0-9-]/g, ''));
  if (!isNaN(numOnly) && numOnly >= -7 && numOnly <= 7) {
    if (numOnly === 0) return 'H';
    return numOnly > 0 ? `H+${numOnly}` : `H${numOnly}`;
  }

  return clean || null;
};

/**
 * Parse nilai integer dari berbagai format (termasuk Excel numeric)
 */
const safeInt = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const n = parseInt(String(val).replace(/[^0-9-]/g, ''));
  return isNaN(n) ? null : n;
};

/**
 * Parse tanggal dari Excel serial number atau string
 */
const parseDate = (val) => {
  if (!val) return null;
  // Excel serial date number
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
  }
  const s = String(val).trim();
  // Format DD/MM/YYYY
  const ddmmyyyy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
  }
  // Format YYYY-MM-DD
  const yyyymmdd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (yyyymmdd) {
    return `${yyyymmdd[1]}-${yyyymmdd[2].padStart(2, '0')}-${yyyymmdd[3].padStart(2, '0')}`;
  }
  return s || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: PARSE EXCEL / CSV FILE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Baca file Excel/CSV dan kembalikan array baris raw
 * @param {string} filePath — path file sementara di /uploads
 * @param {string} fileExt — 'xlsx' | 'xls' | 'csv'
 * @returns {{ rawRows: object[], sheetName: string }}
 */
const parseFile = (filePath, fileExt) => {
  const workbook = XLSX.readFile(filePath, {
    type: 'file',
    cellDates: false,  // Kita handle date secara manual
    raw: false,
    defval: null,
  });

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    defval: null,
    raw: false,
  });

  return { rawRows, sheetName };
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: CLEANING — Missing Value & Duplikat
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Header mapping: normalisasi nama kolom dari berbagai format Excel
 * Mendukung variasi nama kolom yang mungkin digunakan mahasiswa
 */
const COLUMN_MAP = {
  gerbang: ['gerbang', 'nama_gerbang', 'name', 'gate', 'gerbang_tol', 'gt', 'lokasi', 'pos'],
  tahun: ['tahun', 'year', 'yr', 'thn'],
  indeks_hari: ['indeks_hari', 'indeks', 'index_hari', 'hari_ke', 'day_index', 'h_index', 'indeks_h', 'h_hari', 'hari_lebaran'],
  v_masuk: ['v_masuk', 'volume_masuk', 'masuk', 'vol_masuk', 'vol_in', 'kendaraan_masuk', 'vmasuk', 'volumein', 'in'],
  v_keluar: ['v_keluar', 'volume_keluar', 'keluar', 'vol_keluar', 'vol_out', 'kendaraan_keluar', 'vkeluar', 'volumeout', 'out'],
  v_total: ['v_total', 'volume_total', 'total', 'vol_total', 'vtotal'],
  tanggal: ['tanggal', 'date', 'tgl', 'time'],
  hari: ['hari', 'day', 'nama_hari'],
  urutan_hari: ['urutan_hari', 'urutan', 'day_order', 'seq'],
};

const findColumn = (rowKeys, aliases) => {
  const lower = rowKeys.map((k) => ({ orig: k, low: String(k).toLowerCase().trim().replace(/[^a-z0-9_]/g, '') }));
  for (const alias of aliases) {
    const aliasClean = alias.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const found = lower.find((k) => k.low === aliasClean || k.low.includes(aliasClean));
    if (found) return found.orig;
  }
  return null;
};

/**
 * Clean & normalisasi satu raw row Excel → format Dataset model
 * @returns {object|null} — null jika row harus di-drop
 */
const cleanRow = (rawRow, colMapping) => {
  const gerbangRaw = colMapping.gerbang ? rawRow[colMapping.gerbang] : null;
  const gerbang = gerbangRaw ? String(gerbangRaw).trim() : 'GT Cikampek Utama';

  const vMasukRaw = colMapping.v_masuk ? rawRow[colMapping.v_masuk] : null;
  const vKeluarRaw = colMapping.v_keluar ? rawRow[colMapping.v_keluar] : null;
  const indeksRaw = colMapping.indeks_hari ? rawRow[colMapping.indeks_hari] : null;

  // Drop jika minimal salah satu volume tidak ada
  if (vMasukRaw === null && vKeluarRaw === null) {
    return null;
  }

  const vMasuk = safeInt(vMasukRaw) ?? 0;
  const vKeluar = safeInt(vKeluarRaw) ?? 0;

  // Drop jika volume bernilai negatif
  if (vMasuk < 0 || vKeluar < 0) {
    return null;
  }

  const indeksHari = normalizeIndeksHari(indeksRaw);
  const tahun = colMapping.tahun ? safeInt(rawRow[colMapping.tahun]) : null;
  const tanggal = colMapping.tanggal ? parseDate(rawRow[colMapping.tanggal]) : null;
  const hari = colMapping.hari ? String(rawRow[colMapping.hari] || '').trim() || null : null;
  const urutanHari = colMapping.urutan_hari ? safeInt(rawRow[colMapping.urutan_hari]) : null;
  const vTotalRaw = colMapping.v_total ? safeInt(rawRow[colMapping.v_total]) : null;

  return {
    gerbang: gerbang,
    tahun: tahun || (tanggal ? parseInt(tanggal.substring(0, 4)) : new Date().getFullYear()),
    indeks_hari: indeksHari,
    volume_masuk: vMasuk,
    volume_keluar: vKeluar,
    volume_total: vTotalRaw !== null ? vTotalRaw : (vMasuk + vKeluar),
    tanggal: tanggal || null,
    hari: hari,
    urutan_hari: urutanHari,
  };
};

/**
 * Hapus duplikat berdasarkan kombinasi data
 */
const removeDuplicates = (rows) => {
  const seen = new Set();
  const unique = [];

  for (const row of rows) {
    const k = `${row.gerbang}|${row.tanggal || row.tahun}|${row.indeks_hari || ''}|${row.volume_masuk}|${row.volume_keluar}`;
    if (!seen.has(k)) {
      seen.add(k);
      unique.push(row);
    }
  }

  return { unique, duplicatesRemoved: rows.length - unique.length };
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: IMPORT FILE (Entry Point untuk Upload)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Import file Excel/CSV: parse → clean → deduplicate → insert ke DB
 * @param {object} file — object dari multer (path, originalname, mimetype)
 * @returns {object} Report import
 */
const importFile = async (file) => {
  const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
  const validExt = ['xlsx', 'xls', 'csv'];
  if (!validExt.includes(ext)) {
    throw new AppError(`Format file tidak didukung: .${ext}. Gunakan .xlsx, .xls, atau .csv.`, 400);
  }

  let rawRows = [];
  let sheetName = '';

  try {
    const parsed = parseFile(file.path, ext);
    rawRows = parsed.rawRows;
    sheetName = parsed.sheetName;
  } catch (err) {
    throw new AppError(`Gagal membaca file: ${err.message}`, 422);
  } finally {
    // Hapus file temp
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
  }

  if (rawRows.length === 0) {
    throw new AppError('File kosong atau tidak ada data yang bisa dibaca.', 400);
  }

  // Deteksi column mapping dari baris pertama
  const firstRowKeys = Object.keys(rawRows[0]);
  const colMapping = {};
  for (const [field, aliases] of Object.entries(COLUMN_MAP)) {
    colMapping[field] = findColumn(firstRowKeys, aliases);
  }

  // Validasi kolom volume minimal salah satu ada
  if (!colMapping.v_masuk && !colMapping.v_keluar) {
    throw new AppError(`Kolom volume (v_masuk/v_keluar) tidak ditemukan. Kolom tersedia di file: ${firstRowKeys.join(', ')}`, 422);
  }

  // ── Clean rows ────────────────────────────────────────────────────────────
  const totalRaw = rawRows.length;
  const cleanedRows = [];
  let missingDropped = 0;

  for (const row of rawRows) {
    const cleaned = cleanRow(row, colMapping);
    if (cleaned === null) {
      missingDropped++;
    } else {
      cleanedRows.push(cleaned);
    }
  }

  // ── Remove duplicates ─────────────────────────────────────────────────────
  const { unique: finalRows, duplicatesRemoved } = removeDuplicates(cleanedRows);

  if (finalRows.length === 0) {
    throw new AppError('Tidak ada data valid setelah cleaning. Periksa format file Anda.', 400);
  }

  // ── Bulk insert ke database ───────────────────────────────────────────────
  const t = await sequelize.transaction();
  let rowsInserted = 0;
  try {
    const created = await Dataset.bulkCreate(finalRows, {
      validate: true,
      ignoreDuplicates: true,
      transaction: t,
    });
    rowsInserted = created.length;
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  // ── Simpan log preprocessing ──────────────────────────────────────────────
  await PreprocessingLog.create({
    filename: file.originalname,
    file_type: ext === 'csv' ? 'csv' : ext === 'xls' ? 'xls' : 'xlsx',
    total_rows_raw: totalRaw,
    duplicates_removed: duplicatesRemoved,
    missing_dropped: missingDropped,
    rows_inserted: rowsInserted,
    status: 'success',
  });

  // ── Auto-run Pipeline: Scaling -> K-Means -> Time Series ──────────────────
  try {
    await runMinMaxScaling();
    const kmeansService = require('./kmeans.service');
    const timeseriesService = require('./timeseries.service');
    await kmeansService.runClustering(3);
    await timeseriesService.generateAndSave();
  } catch (pipelineErr) {
    console.log('⚠️ Auto-pipeline warning:', pipelineErr.message);
  }

  return {
    filename: file.originalname,
    sheet: sheetName,
    summary: {
      total_baris_file: totalRaw,
      missing_value_dibuang: missingDropped,
      duplikat_dibuang: duplicatesRemoved,
      berhasil_diimport: rowsInserted,
    },
    column_mapping: colMapping,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: MIN-MAX SCALING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Jalankan Min-Max Scaling pada semua data di tabel datasets.
 * Formula: x_scaled = (x - x_min) / (x_max - x_min)
 *
 * Menyimpan:
 * - Nilai scaled ke preprocessing_results
 * - Rumus (min/max) ke preprocessing_logs
 */
const runMinMaxScaling = async () => {
  const datasets = await Dataset.findAll({ raw: true });

  if (datasets.length === 0) {
    throw new AppError('Tidak ada data dataset. Upload file Excel/CSV terlebih dahulu.', 400);
  }

  // Hitung statistik dengan safe getters
  const getMasuk = (d) => Number(d.volume_masuk ?? d.v_masuk ?? 0);
  const getKeluar = (d) => Number(d.volume_keluar ?? d.v_keluar ?? 0);

  const vMasukArr = datasets.map(getMasuk);
  const vKeluarArr = datasets.map(getKeluar);

  const minMasuk = Math.min(...vMasukArr);
  const maxMasuk = Math.max(...vMasukArr);
  const minKeluar = Math.min(...vKeluarArr);
  const maxKeluar = Math.max(...vKeluarArr);

  const rangeMasuk = (maxMasuk - minMasuk) || 1;
  const rangeKeluar = (maxKeluar - minKeluar) || 1;

  // Build data scaled
  const scaledRows = datasets.map((d) => {
    const valMasuk = getMasuk(d);
    const valKeluar = getKeluar(d);
    const scaledMasuk = Math.max(0, Math.min(1, (valMasuk - minMasuk) / rangeMasuk));
    const scaledKeluar = Math.max(0, Math.min(1, (valKeluar - minKeluar) / rangeKeluar));

    return {
      dataset_id: d.id,
      volume_masuk_scaled: parseFloat(scaledMasuk.toFixed(8)),
      volume_keluar_scaled: parseFloat(scaledKeluar.toFixed(8)),
      cluster_label: null,
    };
  });

  // Simpan ke DB (replace semua)
  const t = await sequelize.transaction();
  try {
    await PreprocessingResult.destroy({ where: {}, truncate: true, transaction: t });
    await PreprocessingResult.bulkCreate(scaledRows, { transaction: t });

    // Update log terakhir dengan nilai min/max
    const lastLog = await PreprocessingLog.findOne({ order: [['id', 'DESC']], transaction: t });
    if (lastLog) {
      await lastLog.update({
        min_v_masuk: minMasuk,
        max_v_masuk: maxMasuk,
        min_v_keluar: minKeluar,
        max_v_keluar: maxKeluar,
      }, { transaction: t });
    }

    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  return {
    jumlah_data_diproses: scaledRows.length,
    rumus: 'x_scaled = (x - x_min) / (x_max - x_min)',
    parameter_scaling: {
      v_masuk: {
        x_min: minMasuk,
        x_max: maxMasuk,
        range: rangeMasuk,
        contoh_formula: `x_scaled = (x - ${minMasuk}) / (${maxMasuk} - ${minMasuk})`,
      },
      v_keluar: {
        x_min: minKeluar,
        x_max: maxKeluar,
        range: rangeKeluar,
        contoh_formula: `x_scaled = (x - ${minKeluar}) / (${maxKeluar} - ${minKeluar})`,
      },
    },
    sampel_hasil: scaledRows.slice(0, 5),
  };
};

/**
 * Get semua hasil preprocessing dengan data aslinya
 */
const getAll = async ({ page = 1, limit = 100 } = {}) => {
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const { count, rows } = await PreprocessingResult.findAndCountAll({
    include: [
      {
        association: 'dataset',
        attributes: ['gerbang', 'tahun', 'tanggal', 'indeks_hari', 'hari', 'v_masuk', 'v_keluar', 'v_total'],
      },
    ],
    order: [['id', 'ASC']],
    limit: parseInt(limit),
    offset,
  });

  return { data: rows, total: count, page, limit };
};

/**
 * Get log riwayat import
 */
const getLogs = async () => {
  return PreprocessingLog.findAll({ order: [['createdAt', 'DESC']], limit: 20 });
};

/**
 * Get statistik dataset (untuk dashboard overview)
 */
const getStats = async () => {
  const [stats] = await sequelize.query(`
    SELECT
      COUNT(*) as total_records,
      COUNT(DISTINCT gerbang) as total_gerbang,
      COUNT(DISTINCT tahun) as total_tahun,
      MIN(tahun) as tahun_awal,
      MAX(tahun) as tahun_akhir,
      MIN(v_masuk) as min_v_masuk,
      MAX(v_masuk) as max_v_masuk,
      MIN(v_keluar) as min_v_keluar,
      MAX(v_keluar) as max_v_keluar,
      AVG(v_masuk) as avg_v_masuk,
      AVG(v_keluar) as avg_v_keluar
    FROM datasets
  `);

  const [logStats] = await sequelize.query(`
    SELECT
      SUM(total_rows_raw) as total_rows_imported,
      SUM(duplicates_removed) as total_duplikat,
      SUM(missing_dropped) as total_missing,
      COUNT(*) as total_file_uploaded
    FROM preprocessing_logs
    WHERE status = 'success'
  `);

  return {
    dataset: stats[0],
    import_history: logStats[0],
  };
};

module.exports = {
  importFile,
  runMinMaxScaling,
  getAll,
  getLogs,
  getStats,
};
