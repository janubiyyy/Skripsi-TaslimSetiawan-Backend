/**
 * src/services/kmeans.service.js
 *
 * Modul K-Means Clustering:
 * - Implementasi K-Means dari scratch dengan K-Means++ initialization
 * - K=3 dengan label semantik: C1 Rendah / C2 Sedang / C3 Tinggi
 * - Euclidean Distance yang akurat
 * - Konvergensi hingga centroid stabil atau maxIter tercapai
 * - Elbow Method (SSE/Inertia) untuk validasi pemilihan K
 * - Output scatter plot data untuk Chart.js
 */

const { randomUUID } = require('crypto');
const { PreprocessingResult, KmeansCluster, Dataset } = require('../models');
const { sequelize } = require('../config/database');
const { AppError } = require('../middlewares/errorHandler');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER MATEMATIKA
// ─────────────────────────────────────────────────────────────────────────────

/** Euclidean distance antara dua titik 2D */
const euclidean = (a, b) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);

/**
 * K-Means++ Initialization
 * Memilih centroid awal yang tersebar jauh satu sama lain,
 * mengurangi kemungkinan hasil clustering yang buruk.
 */
const initCentroidsKMeansPP = (points, k) => {
  const n = points.length;
  const centroids = [];

  // Pilih centroid pertama secara acak
  centroids.push([...points[Math.floor(Math.random() * n)]]);

  for (let c = 1; c < k; c++) {
    // Hitung jarak kuadrat setiap titik ke centroid terdekat
    const distances = points.map((p) => {
      const minDist = Math.min(...centroids.map((cen) => euclidean(p, cen)));
      return minDist ** 2;
    });

    // Probabilitas proporsional dengan jarak kuadrat
    const totalDist = distances.reduce((sum, d) => sum + d, 0);
    let rand = Math.random() * totalDist;

    for (let i = 0; i < n; i++) {
      rand -= distances[i];
      if (rand <= 0) {
        centroids.push([...points[i]]);
        break;
      }
    }

    // Safety: jika loop habis tanpa break
    if (centroids.length <= c) {
      centroids.push([...points[Math.floor(Math.random() * n)]]);
    }
  }

  return centroids;
};

/**
 * Assign setiap titik ke centroid terdekat
 * @returns {number[]} assignments — index cluster per titik
 */
const assignClusters = (points, centroids) => {
  return points.map((point) => {
    let minDist = Infinity;
    let bestCluster = 0;
    centroids.forEach((centroid, idx) => {
      const d = euclidean(point, centroid);
      if (d < minDist) {
        minDist = d;
        bestCluster = idx;
      }
    });
    return bestCluster;
  });
};

/**
 * Update centroid = rata-rata titik dalam cluster
 * Jika cluster kosong, centroid tidak berubah
 */
const updateCentroids = (points, assignments, k, oldCentroids) => {
  return Array.from({ length: k }, (_, i) => {
    const members = points.filter((_, idx) => assignments[idx] === i);
    if (members.length === 0) return [...oldCentroids[i]]; // Keep old if empty
    const sumX = members.reduce((s, p) => s + p[0], 0);
    const sumY = members.reduce((s, p) => s + p[1], 0);
    return [sumX / members.length, sumY / members.length];
  });
};

/**
 * Hitung SSE (Sum of Squared Errors / Inertia)
 */
const computeSSE = (points, assignments, centroids) => {
  return points.reduce((sum, p, i) => {
    return sum + euclidean(p, centroids[assignments[i]]) ** 2;
  }, 0);
};

/**
 * Hitung Silhouette Score rata-rata (evaluasi kualitas cluster)
 * Nilai mendekati 1 = cluster baik, mendekati -1 = buruk
 */
const computeSilhouetteScore = (points, assignments, k) => {
  if (k === 1 || points.length < 2) return 0;

  const silhouettes = points.map((p, i) => {
    const myCluster = assignments[i];

    // a(i) = rata-rata jarak ke anggota cluster sendiri
    const sameCluster = points.filter((_, j) => j !== i && assignments[j] === myCluster);
    const a = sameCluster.length === 0 ? 0
      : sameCluster.reduce((sum, q) => sum + euclidean(p, q), 0) / sameCluster.length;

    // b(i) = min rata-rata jarak ke cluster lain
    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === myCluster) continue;
      const otherCluster = points.filter((_, j) => assignments[j] === c);
      if (otherCluster.length === 0) continue;
      const avgDist = otherCluster.reduce((sum, q) => sum + euclidean(p, q), 0) / otherCluster.length;
      if (avgDist < b) b = avgDist;
    }

    if (b === Infinity) return 0;
    return (b - a) / Math.max(a, b);
  });

  return silhouettes.reduce((sum, s) => sum + s, 0) / silhouettes.length;
};

/**
 * Algoritma utama K-Means
 */
const runKMeansAlgorithm = (points, k, maxIter = 300, tolerance = 1e-6) => {
  if (points.length < k) throw new Error(`Data tidak cukup (${points.length}) untuk K=${k}`);

  // Multiple restarts untuk menghindari local optima
  const RESTARTS = 3;
  let bestResult = null;
  let bestSSE = Infinity;

  for (let restart = 0; restart < RESTARTS; restart++) {
    let centroids = initCentroidsKMeansPP(points, k);
    let assignments = assignClusters(points, centroids);
    let iter = 0;
    let converged = false;

    while (iter < maxIter && !converged) {
      const newCentroids = updateCentroids(points, assignments, k, centroids);
      const newAssignments = assignClusters(points, newCentroids);

      // Cek konvergensi: centroid tidak bergerak melebihi tolerance
      const maxShift = centroids.reduce((maxS, oldC, idx) => {
        return Math.max(maxS, euclidean(oldC, newCentroids[idx]));
      }, 0);

      centroids = newCentroids;
      assignments = newAssignments;
      iter++;

      if (maxShift < tolerance) {
        converged = true;
      }
    }

    const sse = computeSSE(points, assignments, centroids);
    if (sse < bestSSE) {
      bestSSE = sse;
      bestResult = { centroids, assignments, sse, iterations: iter, converged };
    }
  }

  return bestResult;
};

// ─────────────────────────────────────────────────────────────────────────────
// LABEL SEMANTIK UNTUK K=3
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assign label semantik berdasarkan posisi centroid
 * Centroid dengan total (masuk+keluar) tertinggi → C3 (Tinggi/Merah)
 * Centroid tengah → C2 (Sedang/Kuning)
 * Centroid terendah → C1 (Rendah/Hijau)
 */
const SEMANTIC_LABELS_K3 = [
  { label: 'C1 - Volume Rendah', color: '#22c55e', severity: 'low', traffic_status: 'Lancar' },
  { label: 'C2 - Volume Sedang', color: '#eab308', severity: 'medium', traffic_status: 'Moderat' },
  { label: 'C3 - Volume Tinggi', color: '#ef4444', severity: 'high', traffic_status: 'Kritis' },
];

const assignSemanticLabels = (centroids, k) => {
  // Rank centroid berdasarkan total v_masuk_scaled + v_keluar_scaled
  const ranked = centroids
    .map((c, i) => ({ originalIdx: i, total: c[0] + c[1] }))
    .sort((a, b) => a.total - b.total); // ascending: rendah → tinggi

  const labelMap = {}; // originalIdx → labelInfo
  ranked.forEach((item, rank) => {
    if (k === 3) {
      labelMap[item.originalIdx] = { rank, ...SEMANTIC_LABELS_K3[rank] };
    } else {
      // Generic label untuk K selain 3
      const level = Math.floor((rank / k) * 3);
      labelMap[item.originalIdx] = {
        rank,
        label: `Cluster ${rank + 1}`,
        color: ['#22c55e', '#eab308', '#ef4444'][level] || '#6366f1',
        severity: ['low', 'medium', 'high'][level] || 'medium',
        traffic_status: ['Lancar', 'Moderat', 'Kritis'][level] || 'Normal',
      };
    }
  });

  return labelMap;
};

// ─────────────────────────────────────────────────────────────────────────────
// API UTAMA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Jalankan K-Means Clustering
 * @param {number} k — jumlah cluster (default 3)
 */
const runClustering = async (k = 3) => {
  if (!k || k < 2 || k > 20) {
    throw new AppError('Nilai K harus antara 2 dan 20.', 400);
  }

  // Ambil data preprocessing
  const preprocessed = await PreprocessingResult.findAll({
    include: [{ association: 'dataset', attributes: ['id', 'gerbang', 'tahun', 'indeks_hari', 'hari', 'tanggal', 'v_masuk', 'v_keluar'] }],
    raw: false,
  });

  if (preprocessed.length < k) {
    throw new AppError(`Data preprocessed tidak cukup (${preprocessed.length} record) untuk K=${k}. Jalankan preprocessing terlebih dahulu.`, 400);
  }

  const points = preprocessed.map((d) => [
    parseFloat(d.volume_masuk_scaled),
    parseFloat(d.volume_keluar_scaled),
  ]);

  // ── Jalankan K-Means ──────────────────────────────────────────────────────
  const { centroids, assignments, sse, iterations, converged } = runKMeansAlgorithm(points, k);

  const silhouette = computeSilhouetteScore(points, assignments, k);
  const labelMap = assignSemanticLabels(centroids, k);
  const runId = randomUUID();

  // Hitung member count per cluster
  const memberCount = Array.from({ length: k }, () => 0);
  assignments.forEach((a) => memberCount[a]++);

  // ── Simpan ke database (transaksi) ────────────────────────────────────────
  const t = await sequelize.transaction();
  try {
    // Hapus hasil K lama
    await KmeansCluster.destroy({ where: { k_value: k }, transaction: t });

    // Simpan centroid
    const clusterRows = centroids.map((c, i) => ({
      k_value: k,
      centroid_masuk: parseFloat(c[0].toFixed(8)),
      centroid_keluar: parseFloat(c[1].toFixed(8)),
      cluster_label: labelMap[i].label,
      member_count: memberCount[i],
      inertia: parseFloat(sse.toFixed(6)),
      silhouette_score: parseFloat(silhouette.toFixed(6)),
      run_id: runId,
    }));
    await KmeansCluster.bulkCreate(clusterRows, { transaction: t });

    // Update cluster_label di preprocessing_results
    for (let i = 0; i < preprocessed.length; i++) {
      await PreprocessingResult.update(
        { cluster_label: assignments[i] },
        { where: { id: preprocessed[i].id }, transaction: t }
      );
    }

    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  // ── Bangun respons ────────────────────────────────────────────────────────
  return {
    run_id: runId,
    k,
    iterations,
    converged,
    evaluasi: {
      inertia_sse: parseFloat(sse.toFixed(6)),
      silhouette_score: parseFloat(silhouette.toFixed(6)),
      interpretasi_silhouette:
        silhouette >= 0.7 ? 'Sangat Baik' :
        silhouette >= 0.5 ? 'Baik' :
        silhouette >= 0.25 ? 'Cukup' : 'Kurang Baik',
    },
    clusters: centroids.map((c, i) => ({
      cluster_index: i,
      ...labelMap[i],
      centroid: {
        v_masuk_scaled: parseFloat(c[0].toFixed(6)),
        v_keluar_scaled: parseFloat(c[1].toFixed(6)),
      },
      member_count: memberCount[i],
      persentase: ((memberCount[i] / preprocessed.length) * 100).toFixed(2) + '%',
    })),
  };
};

/**
 * GET /api/kmeans/results — Data lengkap untuk dashboard
 * Mengembalikan: cluster info, scatter plot data, distribusi, statistik
 */
const getResults = async (k = 3, { tahun = null, gerbang = null } = {}) => {
  // Ambil centroid dari DB
  let clusters = await KmeansCluster.findAll({
    where: { k_value: k },
    order: [['cluster_label', 'ASC']],
  });

  // Jika belum ada hasil clustering, coba jalankan K-Means otomatis
  if (clusters.length === 0) {
    try {
      await runClustering(k);
      clusters = await KmeansCluster.findAll({
        where: { k_value: k },
        order: [['cluster_label', 'ASC']],
      });
    } catch (err) {
      // Ignore if preprocessing data is not yet available
    }
  }

  // Jika tetap kosong (belum ada dataset/preprocessing)
  if (clusters.length === 0) {
    return {
      k,
      clusters: [],
      scatter_plot: { datasets: [] },
      distribusi: { per_tahun: {}, per_indeks_hari: {} },
    };
  }

  // Filter dataset jika ada parameter tahun / gerbang
  const datasetWhere = {};
  if (gerbang) datasetWhere.gerbang = gerbang;
  if (tahun) datasetWhere.tahun = parseInt(tahun);

  // Ambil data preprocessed + dataset untuk scatter plot & counting
  const preprocessed = await PreprocessingResult.findAll({
    where: { cluster_label: { [require('sequelize').Op.ne]: null } },
    include: [
      {
        association: 'dataset',
        where: Object.keys(datasetWhere).length > 0 ? datasetWhere : undefined,
        attributes: ['gerbang', 'tahun', 'indeks_hari', 'hari', 'tanggal', 'v_masuk', 'v_keluar'],
      },
    ],
    raw: false,
  });

  // Hitung member count dinamis berdasarkan filter aktif
  const dynamicMemberCount = {};
  preprocessed.forEach((p) => {
    const idx = p.cluster_label;
    dynamicMemberCount[idx] = (dynamicMemberCount[idx] || 0) + 1;
  });
  const totalFiltered = preprocessed.length;

  // ── Scatter Plot Data (untuk Chart.js scatter) ────────────────────────────
  const labelMap = SEMANTIC_LABELS_K3;
  const scatterData = {};
  for (let i = 0; i < k; i++) {
    const info = k === 3 ? labelMap[i] : { label: `Cluster ${i+1}`, color: '#6366f1' };
    scatterData[i] = {
      label: clusters[i]?.cluster_label || info.label,
      color: k === 3 ? labelMap[i].color : '#6366f1',
      data: [],
    };
  }

  preprocessed.forEach((p) => {
    const clusterIdx = p.cluster_label;
    if (scatterData[clusterIdx] !== undefined) {
      scatterData[clusterIdx].data.push({
        x: parseFloat(p.volume_masuk_scaled),
        y: parseFloat(p.volume_keluar_scaled),
        meta: {
          gerbang: p.dataset?.gerbang,
          tahun: p.dataset?.tahun,
          indeks_hari: p.dataset?.indeks_hari,
          v_masuk: p.dataset?.v_masuk,
          v_keluar: p.dataset?.v_keluar,
        },
      });
    }
  });

  // ── Distribusi cluster per tahun ──────────────────────────────────────────
  const distributionByYear = {};
  preprocessed.forEach((p) => {
    const thn = p.dataset?.tahun;
    const clusterLabel = clusters[p.cluster_label]?.cluster_label || `Cluster ${p.cluster_label}`;
    if (!thn) return;
    if (!distributionByYear[thn]) distributionByYear[thn] = {};
    distributionByYear[thn][clusterLabel] = (distributionByYear[thn][clusterLabel] || 0) + 1;
  });

  // ── Distribusi cluster per indeks_hari ─────────────────────────────────────
  const distributionByHari = {};
  preprocessed.forEach((p) => {
    const indeks = p.dataset?.indeks_hari || 'Unknown';
    const clusterLabel = clusters[p.cluster_label]?.cluster_label || `Cluster ${p.cluster_label}`;
    if (!distributionByHari[indeks]) distributionByHari[indeks] = {};
    distributionByHari[indeks][clusterLabel] = (distributionByHari[indeks][clusterLabel] || 0) + 1;
  });

  return {
    k,
    clusters: clusters.map((c, idx) => {
      const cnt = dynamicMemberCount[idx] !== undefined ? dynamicMemberCount[idx] : (totalFiltered === 0 ? 0 : c.member_count);
      const pct = totalFiltered > 0 ? ((cnt / totalFiltered) * 100).toFixed(1) + '%' : '0%';
      return {
        id: c.id,
        k_value: c.k_value,
        label: c.cluster_label,
        centroid: {
          v_masuk_scaled: parseFloat(c.centroid_masuk),
          v_keluar_scaled: parseFloat(c.centroid_keluar),
        },
        member_count: cnt,
        persentase: pct,
        evaluasi: {
          inertia: c.inertia,
          silhouette_score: c.silhouette_score,
        },
        color: k === 3 ? ['#22c55e', '#eab308', '#ef4444'][idx % 3] : '#6366f1',
      };
    }),
    scatter_plot: {
      datasets: Object.values(scatterData).map((sd) => ({
        label: sd.label,
        backgroundColor: sd.color,
        data: sd.data,
      })),
      axes: {
        x: { label: 'Volume Masuk (Normalized)', min: 0, max: 1 },
        y: { label: 'Volume Keluar (Normalized)', min: 0, max: 1 },
      },
    },
    distribusi: {
      per_tahun: distributionByYear,
      per_indeks_hari: distributionByHari,
    },
  };
};

/**
 * Elbow Method: jalankan K-Means untuk berbagai nilai K dan kembalikan SSE
 * Berguna untuk visualisasi Elbow Curve di frontend
 */
const runElbowMethod = async (kMin = 2, kMax = 8) => {
  const preprocessed = await PreprocessingResult.findAll({ raw: true });
  if (preprocessed.length < kMax) {
    throw new AppError(`Data tidak cukup untuk elbow method hingga K=${kMax}.`, 400);
  }

  const points = preprocessed.map((d) => [
    parseFloat(d.volume_masuk_scaled),
    parseFloat(d.volume_keluar_scaled),
  ]);

  const elbowData = [];
  for (let k = kMin; k <= kMax; k++) {
    const { sse, iterations } = runKMeansAlgorithm(points, k, 200);
    elbowData.push({ k, sse: parseFloat(sse.toFixed(4)), iterations });
  }

  return {
    elbow_data: elbowData,
    chart_data: {
      labels: elbowData.map((d) => `K=${d.k}`),
      datasets: [{
        label: 'SSE (Inertia)',
        data: elbowData.map((d) => d.sse),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.3,
      }],
    },
    rekomendasi: 'Pilih K di titik "siku" (elbow) dimana penurunan SSE mulai melambat.',
  };
};

/**
 * Get nilai K yang sudah pernah dijalankan
 */
const getAvailableK = async () => {
  const result = await KmeansCluster.findAll({
    attributes: [
      [sequelize.fn('DISTINCT', sequelize.col('k_value')), 'k_value'],
      [sequelize.fn('MAX', sequelize.col('member_count')), 'total_members'],
      [sequelize.fn('MAX', sequelize.col('silhouette_score')), 'silhouette_score'],
    ],
    group: ['k_value'],
    order: [['k_value', 'ASC']],
    raw: true,
  });
  return result;
};

module.exports = { runClustering, getResults, runElbowMethod, getAvailableK };
