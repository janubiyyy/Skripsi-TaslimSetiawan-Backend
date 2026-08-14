/**
 * src/models/KmeansCluster.js
 *
 * Tabel: kmeans_clusters
 * Menyimpan hasil clustering K-Means:
 * centroid posisi untuk setiap cluster pada setiap nilai K.
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class KmeansCluster extends Model {}

KmeansCluster.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    // Nilai K yang digunakan pada run K-Means ini
    k_value: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      validate: {
        min: 2,
        max: 20,
      },
    },
    // Posisi centroid sumbu v_masuk_scaled
    centroid_masuk: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    // Posisi centroid sumbu v_keluar_scaled
    centroid_keluar: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    // Label cluster (misal: 0, 1, 2 atau "Tinggi", "Sedang", "Rendah")
    cluster_label: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Label human-readable untuk cluster ini',
    },
    // Jumlah data points yang masuk cluster ini
    member_count: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0,
    },
    // Nilai inertia/SSE run ini (opsional, berguna untuk Elbow Method)
    inertia: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Sum of Squared Errors untuk run ini (Elbow Method)',
    },
    // Silhouette score (opsional)
    silhouette_score: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    // Identifier run (berguna jika ada multi-run atau perbandingan K)
    run_id: {
      type: DataTypes.STRING(36),
      allowNull: true,
      comment: 'UUID run clustering untuk mengelompokkan hasil satu eksekusi',
    },
  },
  {
    sequelize,
    tableName: 'kmeans_clusters',
    modelName: 'KmeansCluster',
    indexes: [
      { fields: ['k_value'] },
      { fields: ['run_id'] },
    ],
  }
);

module.exports = KmeansCluster;
