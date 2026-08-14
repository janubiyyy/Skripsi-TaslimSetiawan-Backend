/**
 * src/models/PreprocessingResult.js
 *
 * Tabel: preprocessing_results
 * Menyimpan hasil normalisasi/scaling data dari tabel datasets.
 * Digunakan sebagai input K-Means Clustering.
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class PreprocessingResult extends Model {}

PreprocessingResult.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    // FK → datasets.id
    dataset_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'datasets',
        key: 'id',
      },
    },
    // Nilai v_masuk setelah Min-Max Scaling (0–1)
    volume_masuk_scaled: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      validate: {
        min: 0,
        max: 1,
      },
    },
    // Nilai v_keluar setelah Min-Max Scaling (0–1)
    volume_keluar_scaled: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      validate: {
        min: 0,
        max: 1,
      },
    },
    // Label cluster hasil K-Means (diisi setelah clustering)
    cluster_label: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
      comment: 'Hasil assignment cluster K-Means (0-based index)',
    },
  },
  {
    sequelize,
    tableName: 'preprocessing_results',
    modelName: 'PreprocessingResult',
    indexes: [
      { fields: ['dataset_id'] },
      { fields: ['cluster_label'] },
    ],
  }
);

module.exports = PreprocessingResult;
