/**
 * src/config/memoryStore.js — Global In-Memory Store for Serverless Environment
 */

const sampleTrafficData = [
  // 2024 Data (H-7 to H+7)
  { id: 1, gerbang: 'GT Cikampek Utama 1', tahun: 2024, indeks_hari: 'H-7', volume_masuk: 45210, volume_keluar: 28400, volume_total: 73610, tanggal: '2024-04-03', hari: 'Rabu', urutan_hari: -7 },
  { id: 2, gerbang: 'GT Cikampek Utama 1', tahun: 2024, indeks_hari: 'H-6', volume_masuk: 51800, volume_keluar: 31200, volume_total: 83000, tanggal: '2024-04-04', hari: 'Kamis', urutan_hari: -6 },
  { id: 3, gerbang: 'GT Cikampek Utama 1', tahun: 2024, indeks_hari: 'H-5', volume_masuk: 68400, volume_keluar: 34500, volume_total: 102900, tanggal: '2024-04-05', hari: 'Jumat', urutan_hari: -5 },
  { id: 4, gerbang: 'GT Cikampek Utama 1', tahun: 2024, indeks_hari: 'H-4', volume_masuk: 89100, volume_keluar: 38200, volume_total: 127300, tanggal: '2024-04-06', hari: 'Sabtu', urutan_hari: -4 },
  { id: 5, gerbang: 'GT Cikampek Utama 1', tahun: 2024, indeks_hari: 'H-3', volume_masuk: 97500, volume_keluar: 39100, volume_total: 136600, tanggal: '2024-04-07', hari: 'Minggu', urutan_hari: -3 },
  { id: 6, gerbang: 'GT Cikampek Utama 1', tahun: 2024, indeks_hari: 'H-2', volume_masuk: 104200, volume_keluar: 41000, volume_total: 145200, tanggal: '2024-04-08', hari: 'Senin', urutan_hari: -2 },
  { id: 7, gerbang: 'GT Cikampek Utama 1', tahun: 2024, indeks_hari: 'H-1', volume_masuk: 88900, volume_keluar: 36500, volume_total: 125400, tanggal: '2024-04-09', hari: 'Selasa', urutan_hari: -1 },
  { id: 8, gerbang: 'GT Cikampek Utama 1', tahun: 2024, indeks_hari: 'H', volume_masuk: 62100, volume_keluar: 31000, volume_total: 93100, tanggal: '2024-04-10', hari: 'Rabu', urutan_hari: 0 },
  { id: 9, gerbang: 'GT Cikampek Utama 1', tahun: 2024, indeks_hari: 'H+1', volume_masuk: 54300, volume_keluar: 48900, volume_total: 103200, tanggal: '2024-04-11', hari: 'Kamis', urutan_hari: 1 },
  { id: 10, gerbang: 'GT Cikampek Utama 1', tahun: 2024, indeks_hari: 'H+2', volume_masuk: 48900, volume_keluar: 67200, volume_total: 116100, tanggal: '2024-04-12', hari: 'Jumat', urutan_hari: 2 },
  { id: 11, gerbang: 'GT Cikampek Utama 1', tahun: 2024, indeks_hari: 'H+3', volume_masuk: 42100, volume_keluar: 89400, volume_total: 131500, tanggal: '2024-04-13', hari: 'Sabtu', urutan_hari: 3 },
  { id: 12, gerbang: 'GT Cikampek Utama 1', tahun: 2024, indeks_hari: 'H+4', volume_masuk: 39500, volume_keluar: 112800, volume_total: 152300, tanggal: '2024-04-14', hari: 'Minggu', urutan_hari: 4 },
  { id: 13, gerbang: 'GT Cikampek Utama 1', tahun: 2024, indeks_hari: 'H+5', volume_masuk: 36200, volume_keluar: 98100, volume_total: 134300, tanggal: '2024-04-15', hari: 'Senin', urutan_hari: 5 },
  { id: 14, gerbang: 'GT Cikampek Utama 1', tahun: 2024, indeks_hari: 'H+6', volume_masuk: 33400, volume_keluar: 72500, volume_total: 105900, tanggal: '2024-04-16', hari: 'Selasa', urutan_hari: 6 },
  { id: 15, gerbang: 'GT Cikampek Utama 1', tahun: 2024, indeks_hari: 'H+7', volume_masuk: 31000, volume_keluar: 55400, volume_total: 86400, tanggal: '2024-04-17', hari: 'Rabu', urutan_hari: 7 },

  // 2023 Data (H-7 to H+7)
  { id: 16, gerbang: 'GT Cikampek Utama 1', tahun: 2023, indeks_hari: 'H-7', volume_masuk: 41200, volume_keluar: 26500, volume_total: 67700, tanggal: '2023-04-15', hari: 'Sabtu', urutan_hari: -7 },
  { id: 17, gerbang: 'GT Cikampek Utama 1', tahun: 2023, indeks_hari: 'H-6', volume_masuk: 47800, volume_keluar: 29100, volume_total: 76900, tanggal: '2023-04-16', hari: 'Minggu', urutan_hari: -6 },
  { id: 18, gerbang: 'GT Cikampek Utama 1', tahun: 2023, indeks_hari: 'H-5', volume_masuk: 62500, volume_keluar: 32400, volume_total: 94900, tanggal: '2023-04-17', hari: 'Senin', urutan_hari: -5 },
  { id: 19, gerbang: 'GT Cikampek Utama 1', tahun: 2023, indeks_hari: 'H-4', volume_masuk: 81400, volume_keluar: 35100, volume_total: 116500, tanggal: '2023-04-18', hari: 'Selasa', urutan_hari: -4 },
  { id: 20, gerbang: 'GT Cikampek Utama 1', tahun: 2023, indeks_hari: 'H-3', volume_masuk: 92300, volume_keluar: 36800, volume_total: 129100, tanggal: '2023-04-19', hari: 'Rabu', urutan_hari: -3 },
  { id: 21, gerbang: 'GT Cikampek Utama 1', tahun: 2023, indeks_hari: 'H-2', volume_masuk: 98700, volume_keluar: 38400, volume_total: 137100, tanggal: '2023-04-20', hari: 'Kamis', urutan_hari: -2 },
  { id: 22, gerbang: 'GT Cikampek Utama 1', tahun: 2023, indeks_hari: 'H-1', volume_masuk: 82400, volume_keluar: 34100, volume_total: 116500, tanggal: '2023-04-21', hari: 'Jumat', urutan_hari: -1 },
  { id: 23, gerbang: 'GT Cikampek Utama 1', tahun: 2023, indeks_hari: 'H', volume_masuk: 58900, volume_keluar: 29500, volume_total: 88400, tanggal: '2023-04-22', hari: 'Sabtu', urutan_hari: 0 },
  { id: 24, gerbang: 'GT Cikampek Utama 1', tahun: 2023, indeks_hari: 'H+1', volume_masuk: 51200, volume_keluar: 45600, volume_total: 96800, tanggal: '2023-04-23', hari: 'Minggu', urutan_hari: 1 },
  { id: 25, gerbang: 'GT Cikampek Utama 1', tahun: 2023, indeks_hari: 'H+2', volume_masuk: 45600, volume_keluar: 62400, volume_total: 108000, tanggal: '2023-04-24', hari: 'Senin', urutan_hari: 2 },
  { id: 26, gerbang: 'GT Cikampek Utama 1', tahun: 2023, indeks_hari: 'H+3', volume_masuk: 39800, volume_keluar: 83500, volume_total: 123300, tanggal: '2023-04-25', hari: 'Selasa', urutan_hari: 3 },
  { id: 27, gerbang: 'GT Cikampek Utama 1', tahun: 2023, indeks_hari: 'H+4', volume_masuk: 36400, volume_keluar: 104200, volume_total: 140600, tanggal: '2023-04-26', hari: 'Rabu', urutan_hari: 4 },
  { id: 28, gerbang: 'GT Cikampek Utama 1', tahun: 2023, indeks_hari: 'H+5', volume_masuk: 34100, volume_keluar: 91200, volume_total: 125300, tanggal: '2023-04-27', hari: 'Kamis', urutan_hari: 5 },
  { id: 29, gerbang: 'GT Cikampek Utama 1', tahun: 2023, indeks_hari: 'H+6', volume_masuk: 31200, volume_keluar: 68400, volume_total: 99600, tanggal: '2023-04-28', hari: 'Jumat', urutan_hari: 6 },
  { id: 30, gerbang: 'GT Cikampek Utama 1', tahun: 2023, indeks_hari: 'H+7', volume_masuk: 29500, volume_keluar: 51200, volume_total: 80700, tanggal: '2023-04-29', hari: 'Sabtu', urutan_hari: 7 },

  // 2022 Data (H-7 to H+7)
  { id: 31, gerbang: 'GT Cikampek Utama 2', tahun: 2022, indeks_hari: 'H-7', volume_masuk: 38500, volume_keluar: 24100, volume_total: 62600, tanggal: '2022-04-25', hari: 'Senin', urutan_hari: -7 },
  { id: 32, gerbang: 'GT Cikampek Utama 2', tahun: 2022, indeks_hari: 'H-6', volume_masuk: 43200, volume_keluar: 26800, volume_total: 70000, tanggal: '2022-04-26', hari: 'Selasa', urutan_hari: -6 },
  { id: 33, gerbang: 'GT Cikampek Utama 2', tahun: 2022, indeks_hari: 'H-5', volume_masuk: 57400, volume_keluar: 29500, volume_total: 86900, tanggal: '2022-04-27', hari: 'Rabu', urutan_hari: -5 },
  { id: 34, gerbang: 'GT Cikampek Utama 2', tahun: 2022, indeks_hari: 'H-4', volume_masuk: 75100, volume_keluar: 32100, volume_total: 107200, tanggal: '2022-04-28', hari: 'Kamis', urutan_hari: -4 },
  { id: 35, gerbang: 'GT Cikampek Utama 2', tahun: 2022, indeks_hari: 'H-3', volume_masuk: 85600, volume_keluar: 34200, volume_total: 119800, tanggal: '2022-04-29', hari: 'Jumat', urutan_hari: -3 },
  { id: 36, gerbang: 'GT Cikampek Utama 2', tahun: 2022, indeks_hari: 'H-2', volume_masuk: 91200, volume_keluar: 35800, volume_total: 127000, tanggal: '2022-04-30', hari: 'Sabtu', urutan_hari: -2 },
  { id: 37, gerbang: 'GT Cikampek Utama 2', tahun: 2022, indeks_hari: 'H-1', volume_masuk: 76500, volume_keluar: 31400, volume_total: 107900, tanggal: '2022-05-01', hari: 'Minggu', urutan_hari: -1 },
  { id: 38, gerbang: 'GT Cikampek Utama 2', tahun: 2022, indeks_hari: 'H', volume_masuk: 54100, volume_keluar: 27200, volume_total: 81300, tanggal: '2022-05-02', hari: 'Senin', urutan_hari: 0 },
  { id: 39, gerbang: 'GT Cikampek Utama 2', tahun: 2022, indeks_hari: 'H+1', volume_masuk: 47200, volume_keluar: 42100, volume_total: 89300, tanggal: '2022-05-03', hari: 'Selasa', urutan_hari: 1 },
  { id: 40, gerbang: 'GT Cikampek Utama 2', tahun: 2022, indeks_hari: 'H+2', volume_masuk: 41800, volume_keluar: 57600, volume_total: 99400, tanggal: '2022-05-04', hari: 'Rabu', urutan_hari: 2 },
  { id: 41, gerbang: 'GT Cikampek Utama 2', tahun: 2022, indeks_hari: 'H+3', volume_masuk: 36500, volume_keluar: 77200, volume_total: 113700, tanggal: '2022-05-05', hari: 'Kamis', urutan_hari: 3 },
  { id: 42, gerbang: 'GT Cikampek Utama 2', tahun: 2022, indeks_hari: 'H+4', volume_masuk: 33200, volume_keluar: 96400, volume_total: 129600, tanggal: '2022-05-06', hari: 'Jumat', urutan_hari: 4 },
  { id: 43, gerbang: 'GT Cikampek Utama 2', tahun: 2022, indeks_hari: 'H+5', volume_masuk: 31400, volume_keluar: 84200, volume_total: 115600, tanggal: '2022-05-07', hari: 'Sabtu', urutan_hari: 5 },
  { id: 44, gerbang: 'GT Cikampek Utama 2', tahun: 2022, indeks_hari: 'H+6', volume_masuk: 28900, volume_keluar: 63100, volume_total: 92000, tanggal: '2022-05-08', hari: 'Minggu', urutan_hari: 6 },
  { id: 45, gerbang: 'GT Cikampek Utama 2', tahun: 2022, indeks_hari: 'H+7', volume_masuk: 27100, volume_keluar: 47200, volume_total: 74300, tanggal: '2022-05-09', hari: 'Senin', urutan_hari: 7 },
];

if (!global.__SKRIPSI_STORE__) {
  global.__SKRIPSI_STORE__ = {
    datasets: sampleTrafficData.map((d, idx) => ({ id: idx + 1, ...d })),
    preprocessing: [],
    kmeans: {
      k: 3,
      clusters: [
        { k_value: 3, cluster_id: 0, label: 'Cluster 0 (Rendah)', member_count: 15, avg_v_masuk: 35000, avg_v_keluar: 25000 },
        { k_value: 3, cluster_id: 1, label: 'Cluster 1 (Sedang)', member_count: 18, avg_v_masuk: 60000, avg_v_keluar: 40000 },
        { k_value: 3, cluster_id: 2, label: 'Cluster 2 (Tinggi/Puncak)', member_count: 12, avg_v_masuk: 95000, avg_v_keluar: 98000 },
      ],
    },
    timeseries: [],
  };
}

module.exports = global.__SKRIPSI_STORE__;
