/**
 * src/models/Dataset.js
 *
 * Tabel: datasets
 * Menyimpan data lalu lintas dari CSV upload.
 * Kolom disesuaikan dengan format CSV:
 * id, gerbang, tahun, indeks_hari, v_masuk, v_keluar, v_total,
 * tanggal, hari, urutan_hari
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Dataset extends Model {}

Dataset.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    // Nama gerbang tol (misal: "Cikampek Utama", "Brebes Timur")
    gerbang: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Nama gerbang tidak boleh kosong.' },
      },
    },
    // Tahun data
    tahun: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: false,
    },
    // Indeks hari (misal: H-7, H-6, ..., H, H+1, ...)
    indeks_hari: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'H-7 sampai H+7 relatif terhadap hari raya',
    },
    // Volume kendaraan masuk
    volume_masuk: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'v_masuk',
    },
    // Volume kendaraan keluar
    volume_keluar: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'v_keluar',
    },
    // Volume total (masuk + keluar)
    volume_total: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'v_total',
    },
    // Tanggal (YYYY-MM-DD)
    tanggal: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    // Nama hari (Senin, Selasa, ...)
    hari: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    // Urutan hari dalam periode Lebaran (numerik: 1, 2, ...)
    urutan_hari: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'datasets',
    modelName: 'Dataset',
    indexes: [
      { fields: ['gerbang'] },
      { fields: ['tahun'] },
      { fields: ['tanggal'] },
      { fields: ['indeks_hari'] },
    ],
  }
);

module.exports = Dataset;
