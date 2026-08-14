/**
 * src/models/PreprocessingLog.js
 *
 * Tabel: preprocessing_logs
 * Menyimpan log metadata setiap proses import & preprocessing:
 * nama file, jumlah baris, missing values ditemukan/dibuang, duplikat, dll.
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class PreprocessingLog extends Model {}

PreprocessingLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    // Nama file yang diupload
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    // Format file: 'xlsx', 'xls', 'csv'
    file_type: {
      type: DataTypes.ENUM('xlsx', 'xls', 'csv'),
      allowNull: false,
      defaultValue: 'xlsx',
    },
    // Total baris di file (sebelum cleaning)
    total_rows_raw: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    // Jumlah duplikat yang ditemukan & dihapus
    duplicates_removed: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    // Baris dengan missing value yang di-drop
    missing_dropped: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    // Baris yang berhasil diimport ke datasets
    rows_inserted: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    // Min v_masuk (untuk rumus scaling)
    min_v_masuk: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    max_v_masuk: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    min_v_keluar: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    max_v_keluar: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Status: 'success' | 'partial' | 'failed'
    status: {
      type: DataTypes.ENUM('success', 'partial', 'failed'),
      allowNull: false,
      defaultValue: 'success',
    },
    // Pesan error jika ada
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'preprocessing_logs',
    modelName: 'PreprocessingLog',
  }
);

module.exports = PreprocessingLog;
