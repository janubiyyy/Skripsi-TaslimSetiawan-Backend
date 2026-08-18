/**
 * src/config/memoryStore.js — Global In-Memory Store for Serverless Environment
 */

const { sampleTrafficData } = require('./seedData');

if (!global.__SKRIPSI_STORE__) {
  global.__SKRIPSI_STORE__ = {
    datasets: [...sampleTrafficData],
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
