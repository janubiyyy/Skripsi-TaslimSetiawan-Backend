/**
 * src/services/timeseries.service.js
 *
 * Modul Time Series & Evaluasi:
 * 1. Agregasi tren harian (H-7 s.d. H+7) per gerbang & tahun
 * 2. Komparasi Year-on-Year (2016–2026) untuk analisis tren jangka panjang
 * 3. Kalkulasi MAPE (Mean Absolute Percentage Error)
 * 4. Data siap dikonsumsi Chart.js (Line Chart, Bar Chart)
 */

const { Op } = require('sequelize');
const { Dataset, TimeseriesResult } = require('../models');
const { sequelize } = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

// ─────────────────────────────────────────────────────────────────────────────
// KONSTANTA
// ─────────────────────────────────────────────────────────────────────────────

// Urutan indeks hari untuk sorting chart (dari H-7 ke H+7)
const INDEKS_ORDER = {
  'H-7': -7, 'H-6': -6, 'H-5': -5, 'H-4': -4, 'H-3': -3,
  'H-2': -2, 'H-1': -1, 'H': 0,
  'H+1': 1, 'H+2': 2, 'H+3': 3, 'H+4': 4, 'H+5': 5, 'H+6': 6, 'H+7': 7,
};

const INDEKS_LABELS_SORTED = Object.entries(INDEKS_ORDER)
  .sort((a, b) => a[1] - b[1])
  .map(([label]) => label);

// Palet warna per tahun untuk Chart.js multi-line
const YEAR_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
  '#a855f7',
];

// ─────────────────────────────────────────────────────────────────────────────
// KALKULASI MAPE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hitung MAPE (Mean Absolute Percentage Error)
 * Formula: MAPE = (1/n) * Σ |actual - forecast| / |actual| * 100
 *
 * @param {number[]} actuals — nilai aktual
 * @param {number[]} forecasts — nilai prediksi/baseline
 * @returns {number} MAPE dalam persen
 */
const calculateMAPE = (actuals, forecasts) => {
  if (actuals.length !== forecasts.length || actuals.length === 0) return null;

  let sumAPE = 0;
  let validCount = 0;

  for (let i = 0; i < actuals.length; i++) {
    if (actuals[i] === 0 || actuals[i] === null) continue; // Hindari division by zero
    const ape = Math.abs(actuals[i] - forecasts[i]) / Math.abs(actuals[i]) * 100;
    sumAPE += ape;
    validCount++;
  }

  if (validCount === 0) return null;
  return parseFloat((sumAPE / validCount).toFixed(4));
};

/**
 * Hitung moving average sebagai baseline forecast
 * @param {number[]} values
 * @param {number} window — ukuran jendela
 */
const movingAverage = (values, window = 3) => {
  return values.map((val, i) => {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(values.length, start + window);
    const slice = values.slice(start, end);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// AGREGASI DATA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Agregasi volume per indeks_hari per tahun per gerbang
 * SQL-level aggregation untuk performa
 */
const aggregateByHariTahun = async ({ gerbang = null, tahun = null } = {}) => {
  const where = {
    indeks_hari: { [Op.in]: INDEKS_LABELS_SORTED },
  };
  if (gerbang) where.gerbang = gerbang;
  if (tahun) where.tahun = parseInt(tahun);

  const rows = await Dataset.findAll({
    attributes: [
      'gerbang',
      'tahun',
      'indeks_hari',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count_records'],
      [sequelize.fn('SUM', sequelize.col('v_masuk')), 'total_v_masuk'],
      [sequelize.fn('SUM', sequelize.col('v_keluar')), 'total_v_keluar'],
      [sequelize.fn('AVG', sequelize.col('v_masuk')), 'avg_v_masuk'],
      [sequelize.fn('AVG', sequelize.col('v_keluar')), 'avg_v_keluar'],
      [sequelize.fn('MAX', sequelize.col('v_masuk')), 'max_v_masuk'],
      [sequelize.fn('MIN', sequelize.col('v_masuk')), 'min_v_masuk'],
    ],
    where,
    group: ['gerbang', 'tahun', 'indeks_hari'],
    order: [['gerbang', 'ASC'], ['tahun', 'ASC']],
    raw: true,
  });

  return rows || [];
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE UTAMA: GENERATE & SIMPAN TIME SERIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hitung dan simpan semua hasil time series ke database
 */
const generateAndSave = async () => {
  const datasets = await Dataset.findAll({ raw: true });
  if (datasets.length === 0) {
    throw new AppError('Tidak ada data. Upload dataset terlebih dahulu.', 400);
  }

  // Agregasi semua gerbang & tahun
  const aggRows = await aggregateByHariTahun();

  if (aggRows.length === 0) {
    throw new AppError('Tidak ada data dengan indeks_hari H-7 s.d. H+7. Pastikan data sudah memiliki kolom indeks_hari.', 400);
  }

  // Hitung MAPE: baseline = rata-rata all-year per (gerbang, indeks_hari)
  // Pertama hitung global average per (gerbang, indeks_hari)
  const globalAvg = {};
  const byGerbangIndeks = {};

  aggRows.forEach((row) => {
    const key = `${row.gerbang}|${row.indeks_hari}`;
    if (!byGerbangIndeks[key]) byGerbangIndeks[key] = [];
    byGerbangIndeks[key].push({
      avg_masuk: parseFloat(row.avg_v_masuk),
      avg_keluar: parseFloat(row.avg_v_keluar),
    });
  });

  Object.entries(byGerbangIndeks).forEach(([key, vals]) => {
    globalAvg[key] = {
      masuk: vals.reduce((s, v) => s + v.avg_masuk, 0) / vals.length,
      keluar: vals.reduce((s, v) => s + v.avg_keluar, 0) / vals.length,
    };
  });

  // Build TimeseriesResult rows
  const tsRows = aggRows.map((row) => {
    const key = `${row.gerbang}|${row.indeks_hari}`;
    const baseline = globalAvg[key] || { masuk: row.avg_v_masuk, keluar: row.avg_v_keluar };

    const mapeMasuk = baseline.masuk !== 0
      ? parseFloat((Math.abs(parseFloat(row.avg_v_masuk) - baseline.masuk) / baseline.masuk * 100).toFixed(4))
      : null;
    const mapeKeluar = baseline.keluar !== 0
      ? parseFloat((Math.abs(parseFloat(row.avg_v_keluar) - baseline.keluar) / baseline.keluar * 100).toFixed(4))
      : null;

    return {
      gerbang: row.gerbang,
      tahun: parseInt(row.tahun),
      indeks_hari: row.indeks_hari,
      avg_volume_masuk: parseFloat(parseFloat(row.avg_v_masuk).toFixed(2)),
      avg_volume_keluar: parseFloat(parseFloat(row.avg_v_keluar).toFixed(2)),
      total_volume_masuk: parseInt(row.total_v_masuk),
      total_volume_keluar: parseInt(row.total_v_keluar),
      count_records: parseInt(row.count_records),
      mape_masuk: mapeMasuk,
      mape_keluar: mapeKeluar,
      urutan_indeks: INDEKS_ORDER[row.indeks_hari] ?? null,
    };
  });

  // Simpan ke database
  const t = await sequelize.transaction();
  try {
    await TimeseriesResult.destroy({ where: {}, truncate: true, transaction: t });
    await TimeseriesResult.bulkCreate(tsRows, {
      updateOnDuplicate: [
        'avg_volume_masuk', 'avg_volume_keluar', 'total_volume_masuk',
        'total_volume_keluar', 'count_records', 'mape_masuk', 'mape_keluar', 'urutan_indeks',
      ],
      transaction: t,
    });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  return {
    records_saved: tsRows.length,
    gerbang_covered: [...new Set(tsRows.map((r) => r.gerbang))],
    tahun_covered: [...new Set(tsRows.map((r) => r.tahun))].sort(),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET SUMMARY — Entry point untuk endpoint GET /api/timeseries/summary
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bangun respons lengkap time series untuk dashboard React.js
 * Mencakup: tren harian, YoY comparison, MAPE, chart-ready data
 *
 * @param {object} filters
 * @param {string} [filters.gerbang]
 * @param {string} [filters.metric] - 'masuk' | 'keluar' | 'total'
 */
const getSummary = async ({ gerbang = null, tahun = null, metric = 'masuk' } = {}) => {
  const where = {};
  if (gerbang) where.gerbang = gerbang;
  if (tahun) where.tahun = parseInt(tahun);

  // Ambil semua timeseries results
  let query = await TimeseriesResult.findAll({
    where,
    order: [['tahun', 'ASC'], ['urutan_indeks', 'ASC']],
    raw: true,
  });

  // Jika belum ada data, coba generate otomatis dari dataset
  if (query.length === 0) {
    try {
      await generateAndSave();
      query = await TimeseriesResult.findAll({
        where,
        order: [['tahun', 'ASC'], ['urutan_indeks', 'ASC']],
        raw: true,
      });
    } catch (err) {
      // Ignore if no dataset exists
    }
  }

  // Jika tetap kosong (belum ada dataset)
  if (query.length === 0) {
    return {
      metadata: {
        gerbang_filter: gerbang || 'Semua Gerbang',
        metric_filter: metric,
        tahun_tersedia: [],
        indeks_hari_labels: INDEKS_LABELS_SORTED,
        total_records: 0,
      },
      tren_harian: { data: [], analisis: { hari_puncak: null, hari_terendah: null } },
      year_on_year: { data: {}, chart_line: { labels: INDEKS_LABELS_SORTED, datasets: [] }, chart_bar: { labels: [], datasets: [] } },
      evaluasi_mape: { overall_mape_masuk: null, overall_mape_keluar: null, interpretasi: 'Belum ada data', detail_per_hari: [], catatan: 'Upload dataset terlebih dahulu.' },
    };
  }

  // ── 1. Tren Harian (H-7 s.d. H+7) — Rata-rata semua tahun ───────────────
  const dailyTrendMap = {};
  const yearSet = new Set();

  query.forEach((row) => {
    yearSet.add(row.tahun);
    if (!dailyTrendMap[row.indeks_hari]) {
      dailyTrendMap[row.indeks_hari] = { masuk: [], keluar: [] };
    }
    dailyTrendMap[row.indeks_hari].masuk.push(parseFloat(row.avg_volume_masuk));
    dailyTrendMap[row.indeks_hari].keluar.push(parseFloat(row.avg_volume_keluar));
  });

  const avgDailyTrend = INDEKS_LABELS_SORTED
    .filter((h) => dailyTrendMap[h])
    .map((h) => {
      const data = dailyTrendMap[h];
      const avgMasuk = data.masuk.reduce((s, v) => s + v, 0) / data.masuk.length;
      const avgKeluar = data.keluar.reduce((s, v) => s + v, 0) / data.keluar.length;
      return {
        indeks_hari: h,
        urutan: INDEKS_ORDER[h],
        avg_v_masuk: parseFloat(avgMasuk.toFixed(2)),
        avg_v_keluar: parseFloat(avgKeluar.toFixed(2)),
        avg_v_total: parseFloat((avgMasuk + avgKeluar).toFixed(2)),
      };
    });

  // Identifikasi puncak & lembah
  const metricKey = metric === 'keluar' ? 'avg_v_keluar' : 'avg_v_masuk';
  const peakDay = avgDailyTrend.reduce((max, d) => d[metricKey] > max[metricKey] ? d : max, avgDailyTrend[0]);
  const valleyDay = avgDailyTrend.reduce((min, d) => d[metricKey] < min[metricKey] ? d : min, avgDailyTrend[0]);

  // ── 2. Year-on-Year (YoY) Comparison ─────────────────────────────────────
  const years = [...yearSet].sort();
  const yoyData = {};

  years.forEach((year, idx) => {
    const yearRows = query.filter((r) => r.tahun === year)
      .sort((a, b) => (INDEKS_ORDER[a.indeks_hari] || 0) - (INDEKS_ORDER[b.indeks_hari] || 0));

    yoyData[year] = {
      tahun: year,
      color: YEAR_COLORS[idx % YEAR_COLORS.length],
      data_per_hari: yearRows.map((r) => ({
        indeks_hari: r.indeks_hari,
        avg_v_masuk: parseFloat(r.avg_volume_masuk),
        avg_v_keluar: parseFloat(r.avg_volume_keluar),
        avg_v_total: parseFloat(r.avg_volume_masuk) + parseFloat(r.avg_volume_keluar),
        mape_masuk: r.mape_masuk,
        mape_keluar: r.mape_keluar,
      })),
      total_masuk: yearRows.reduce((s, r) => s + parseInt(r.total_volume_masuk), 0),
      total_keluar: yearRows.reduce((s, r) => s + parseInt(r.total_volume_keluar), 0),
    };

    // YoY growth rate dibanding tahun sebelumnya
    if (idx > 0) {
      const prevYear = years[idx - 1];
      const prevTotal = yoyData[prevYear]?.total_masuk || 0;
      const currTotal = yoyData[year].total_masuk;
      yoyData[year].growth_masuk_pct = prevTotal !== 0
        ? parseFloat(((currTotal - prevTotal) / prevTotal * 100).toFixed(2))
        : null;
    }
  });

  // ── 3. Chart.js Ready — Line Chart Tren Harian per Tahun ─────────────────
  const lineChartDatasets = years.map((year, idx) => {
    const metricField = metric === 'keluar' ? 'avg_v_keluar' : 'avg_v_masuk';
    const yearRows = query
      .filter((r) => r.tahun === year)
      .sort((a, b) => (INDEKS_ORDER[a.indeks_hari] || 0) - (INDEKS_ORDER[b.indeks_hari] || 0));

    const dataByIndeks = {};
    yearRows.forEach((r) => { dataByIndeks[r.indeks_hari] = parseFloat(r.avg_volume_masuk); });
    if (metric === 'keluar') yearRows.forEach((r) => { dataByIndeks[r.indeks_hari] = parseFloat(r.avg_volume_keluar); });

    return {
      label: String(year),
      data: INDEKS_LABELS_SORTED.map((h) => dataByIndeks[h] ?? null),
      borderColor: YEAR_COLORS[idx % YEAR_COLORS.length],
      backgroundColor: 'transparent',
      tension: 0.4,
      pointRadius: 4,
      spanGaps: true,
    };
  });

  // ── 4. Bar Chart — Total Volume per Tahun ─────────────────────────────────
  const barChartYoY = {
    labels: years,
    datasets: [
      {
        label: 'Total Volume Masuk',
        data: years.map((y) => yoyData[y]?.total_masuk || 0),
        backgroundColor: '#6366f1',
      },
      {
        label: 'Total Volume Keluar',
        data: years.map((y) => yoyData[y]?.total_keluar || 0),
        backgroundColor: '#f59e0b',
      },
    ],
  };

  // ── 5. MAPE Summary ───────────────────────────────────────────────────────
  const mapeData = query
    .filter((r) => r.mape_masuk !== null)
    .map((r) => ({
      gerbang: r.gerbang,
      tahun: r.tahun,
      indeks_hari: r.indeks_hari,
      mape_masuk: parseFloat(r.mape_masuk),
      mape_keluar: parseFloat(r.mape_keluar || 0),
      interpretasi: parseFloat(r.mape_masuk) <= 10 ? 'Sangat Akurat' :
                    parseFloat(r.mape_masuk) <= 20 ? 'Akurat' :
                    parseFloat(r.mape_masuk) <= 50 ? 'Cukup' : 'Perlu Review',
    }));

  const overallMAPE_masuk = mapeData.length > 0
    ? parseFloat((mapeData.reduce((s, m) => s + m.mape_masuk, 0) / mapeData.length).toFixed(4))
    : null;
  const overallMAPE_keluar = mapeData.length > 0
    ? parseFloat((mapeData.reduce((s, m) => s + m.mape_keluar, 0) / mapeData.length).toFixed(4))
    : null;

  return {
    metadata: {
      gerbang_filter: gerbang || 'Semua Gerbang',
      metric_filter: metric,
      tahun_tersedia: years,
      indeks_hari_labels: INDEKS_LABELS_SORTED,
      total_records: query.length,
    },
    tren_harian: {
      data: avgDailyTrend,
      analisis: {
        hari_puncak: { ...peakDay, keterangan: 'Hari dengan volume tertinggi rata-rata' },
        hari_terendah: { ...valleyDay, keterangan: 'Hari dengan volume terendah rata-rata' },
      },
    },
    year_on_year: {
      data: yoyData,
      chart_line: {
        labels: INDEKS_LABELS_SORTED,
        datasets: lineChartDatasets,
      },
      chart_bar: barChartYoY,
    },
    evaluasi_mape: {
      overall_mape_masuk: overallMAPE_masuk,
      overall_mape_keluar: overallMAPE_keluar,
      interpretasi: overallMAPE_masuk !== null
        ? (overallMAPE_masuk <= 10 ? 'Model Sangat Akurat (MAPE ≤ 10%)'
          : overallMAPE_masuk <= 20 ? 'Model Akurat (MAPE 10-20%)'
          : overallMAPE_masuk <= 50 ? 'Model Cukup (MAPE 20-50%)'
          : 'Model Perlu Evaluasi (MAPE > 50%)')
        : 'Belum ada data MAPE',
      detail_per_hari: mapeData,
      catatan: 'MAPE dihitung dengan baseline = rata-rata volume seluruh tahun per (gerbang, indeks_hari)',
    },
  };
};

/**
 * GET /api/timeseries/yoy — Data Year-on-Year saja (ringan)
 */
const getYoYComparison = async ({ gerbang = null, indeks_hari = null } = {}) => {
  const where = {};
  if (gerbang) where.gerbang = gerbang;
  if (indeks_hari) where.indeks_hari = indeks_hari;

  const data = await TimeseriesResult.findAll({
    where,
    order: [['tahun', 'ASC'], ['urutan_indeks', 'ASC']],
    raw: true,
  });

  // Pivot: per-tahun berisi array data per indeks_hari
  const pivoted = {};
  data.forEach((row) => {
    if (!pivoted[row.tahun]) pivoted[row.tahun] = [];
    pivoted[row.tahun].push({
      indeks_hari: row.indeks_hari,
      avg_masuk: parseFloat(row.avg_volume_masuk),
      avg_keluar: parseFloat(row.avg_volume_keluar),
      mape_masuk: row.mape_masuk,
    });
  });

  return pivoted;
};

/**
 * Hitung ulang MAPE untuk pasangan data aktual vs prediksi yang diberikan user
 * Berguna untuk endpoint manual calculation
 */
const calculateMAPEManual = ({ actuals, forecasts }) => {
  if (!Array.isArray(actuals) || !Array.isArray(forecasts)) {
    throw new AppError('actuals dan forecasts harus berupa array.', 400);
  }
  if (actuals.length !== forecasts.length) {
    throw new AppError('Panjang actuals dan forecasts harus sama.', 400);
  }

  const mape = calculateMAPE(actuals, forecasts);
  const forecastsMA = movingAverage(actuals);
  const mapeMA = calculateMAPE(actuals, forecastsMA);

  const detail = actuals.map((actual, i) => {
    const forecast = forecasts[i];
    const ape = actual !== 0 ? Math.abs(actual - forecast) / Math.abs(actual) * 100 : null;
    return { index: i, actual, forecast, ape: ape !== null ? parseFloat(ape.toFixed(4)) : null };
  });

  return {
    mape_persen: mape,
    mape_moving_average_persen: mapeMA,
    interpretasi: mape !== null
      ? (mape <= 10 ? 'Sangat Akurat' : mape <= 20 ? 'Akurat' : mape <= 50 ? 'Cukup' : 'Perlu Review')
      : 'Tidak bisa dihitung',
    detail,
    formula: 'MAPE = (1/n) × Σ |Aktual - Prediksi| / |Aktual| × 100%',
  };
};

module.exports = {
  generateAndSave,
  getSummary,
  getYoYComparison,
  calculateMAPEManual,
};
