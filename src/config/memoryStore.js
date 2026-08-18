/**
 * src/config/memoryStore.js — Comprehensive In-Memory Store for GT Cikampek Utama (2016-2026)
 */

const baseHarianPattern = [
  { indeks_hari: 'H-7', hari: 'Rabu', urutan_hari: -7, factor_masuk: 0.72, factor_keluar: 0.52 },
  { indeks_hari: 'H-6', hari: 'Kamis', urutan_hari: -6, factor_masuk: 0.83, factor_keluar: 0.57 },
  { indeks_hari: 'H-5', hari: 'Jumat', urutan_hari: -5, factor_masuk: 1.09, factor_keluar: 0.63 },
  { indeks_hari: 'H-4', hari: 'Sabtu', urutan_hari: -4, factor_masuk: 1.42, factor_keluar: 0.70 },
  { indeks_hari: 'H-3', hari: 'Minggu', urutan_hari: -3, factor_masuk: 1.56, factor_keluar: 0.72 },
  { indeks_hari: 'H-2', hari: 'Senin', urutan_hari: -2, factor_masuk: 1.66, factor_keluar: 0.75 },
  { indeks_hari: 'H-1', hari: 'Selasa', urutan_hari: -1, factor_masuk: 1.42, factor_keluar: 0.67 },
  { indeks_hari: 'H', hari: 'Rabu', urutan_hari: 0, factor_masuk: 0.99, factor_keluar: 0.57 },
  { indeks_hari: 'H+1', hari: 'Kamis', urutan_hari: 1, factor_masuk: 0.87, factor_keluar: 0.90 },
  { indeks_hari: 'H+2', hari: 'Jumat', urutan_hari: 2, factor_masuk: 0.78, factor_keluar: 1.23 },
  { indeks_hari: 'H+3', hari: 'Sabtu', urutan_hari: 3, factor_masuk: 0.67, factor_keluar: 1.64 },
  { indeks_hari: 'H+4', hari: 'Minggu', urutan_hari: 4, factor_masuk: 0.63, factor_keluar: 2.06 },
  { indeks_hari: 'H+5', hari: 'Senin', urutan_hari: 5, factor_masuk: 0.58, factor_keluar: 1.79 },
  { indeks_hari: 'H+6', hari: 'Selasa', urutan_hari: 6, factor_masuk: 0.53, factor_keluar: 1.33 },
  { indeks_hari: 'H+7', hari: 'Rabu', urutan_hari: 7, factor_masuk: 0.49, factor_keluar: 1.01 },
];

const yearConfigs = [
  { tahun: 2016, baseVolume: 42000, dateStart: '2016-06-29', gerbang: 'GT Cikampek Utama 1' },
  { tahun: 2017, baseVolume: 45000, dateStart: '2017-06-18', gerbang: 'GT Cikampek Utama 1' },
  { tahun: 2018, baseVolume: 48000, dateStart: '2018-06-08', gerbang: 'GT Cikampek Utama 1' },
  { tahun: 2019, baseVolume: 52000, dateStart: '2019-05-29', gerbang: 'GT Cikampek Utama 1' },
  { tahun: 2020, baseVolume: 38000, dateStart: '2020-05-17', gerbang: 'GT Cikampek Utama 2' },
  { tahun: 2021, baseVolume: 41000, dateStart: '2021-05-06', gerbang: 'GT Cikampek Utama 2' },
  { tahun: 2022, baseVolume: 55000, dateStart: '2022-04-25', gerbang: 'GT Cikampek Utama 2' },
  { tahun: 2023, baseVolume: 59000, dateStart: '2023-04-15', gerbang: 'GT Cikampek Utama 1' },
  { tahun: 2024, baseVolume: 62700, dateStart: '2024-04-03', gerbang: 'GT Cikampek Utama 1' },
  { tahun: 2025, baseVolume: 66000, dateStart: '2025-03-24', gerbang: 'GT Cikampek Utama 1' },
  { tahun: 2026, baseVolume: 70000, dateStart: '2026-03-13', gerbang: 'GT Cikampek Utama 1' },
];

const generatedTrafficData = [];
let globalId = 1;

yearConfigs.forEach((cfg) => {
  const startDate = new Date(cfg.dateStart);
  baseHarianPattern.forEach((pat, i) => {
    const curDate = new Date(startDate);
    curDate.setDate(startDate.getDate() + i);

    const dateStr = curDate.toISOString().split('T')[0];
    const vMasuk = Math.round(cfg.baseVolume * pat.factor_masuk);
    const vKeluar = Math.round(cfg.baseVolume * pat.factor_keluar);
    const vTotal = vMasuk + vKeluar;

    generatedTrafficData.push({
      id: globalId++,
      gerbang: cfg.gerbang,
      tahun: cfg.tahun,
      indeks_hari: pat.indeks_hari,
      volume_masuk: vMasuk,
      volume_keluar: vKeluar,
      volume_total: vTotal,
      v_masuk: vMasuk,
      v_keluar: vKeluar,
      v_total: vTotal,
      tanggal: dateStr,
      hari: pat.hari,
      urutan_hari: pat.urutan_hari,
    });
  });
});

if (!global.__SKRIPSI_STORE__) {
  global.__SKRIPSI_STORE__ = {
    datasets: generatedTrafficData,
    preprocessing: [],
    kmeans: { k: 3, clusters: [] },
    timeseries: [],
  };
}

module.exports = global.__SKRIPSI_STORE__;
