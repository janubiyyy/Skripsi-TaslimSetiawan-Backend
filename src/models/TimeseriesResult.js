/**
 * src/models/TimeseriesResult.js
 *
 * Tabel: timeseries_results
 * Menyimpan agregasi tren harian dan hasil kalkulasi MAPE per tahun/gerbang.
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class TimeseriesResult extends Model {}

TimeseriesResult.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    // Gerbang tol
    gerbang: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    // Tahun
    tahun: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: false,
    },
    // Indeks hari (H-7 s.d. H+7)
    indeks_hari: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    // Rata-rata volume masuk pada hari tersebut
    avg_volume_masuk: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    // Rata-rata volume keluar
    avg_volume_keluar: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    // Total volume masuk (sum)
    total_volume_masuk: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    // Total volume keluar (sum)
    total_volume_keluar: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    // Jumlah record yang diagregasi
    count_records: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    // MAPE v_masuk (%) terhadap rata-rata all-year sebagai baseline
    mape_masuk: {
      type: DataTypes.DECIMAL(8, 4),
      allowNull: true,
      comment: 'Mean Absolute Percentage Error volume masuk (%)',
    },
    // MAPE v_keluar (%)
    mape_keluar: {
      type: DataTypes.DECIMAL(8, 4),
      allowNull: true,
    },
    // Urutan numerik indeks hari untuk sorting chart (-7 s.d. +7)
    urutan_indeks: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '-7 = H-7, 0 = H, 7 = H+7',
    },
  },
  {
    sequelize,
    tableName: 'timeseries_results',
    modelName: 'TimeseriesResult',
    indexes: [
      { fields: ['gerbang', 'tahun', 'indeks_hari'], unique: true, name: 'unique_gerbang_tahun_indeks' },
      { fields: ['tahun'] },
      { fields: ['indeks_hari'] },
    ],
  }
);

module.exports = TimeseriesResult;
