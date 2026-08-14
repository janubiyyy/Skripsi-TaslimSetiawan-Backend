/**
 * src/models/index.js — Load dan asosiasikan semua model Sequelize
 */

const { sequelize } = require('../config/database');
const User = require('./User');
const Dataset = require('./Dataset');
const PreprocessingResult = require('./PreprocessingResult');
const PreprocessingLog = require('./PreprocessingLog');
const KmeansCluster = require('./KmeansCluster');
const TimeseriesResult = require('./TimeseriesResult');

// ── Relasi antar model ─────────────────────────────────────────────────────
// Dataset → PreprocessingResult (One to Many)
Dataset.hasMany(PreprocessingResult, {
  foreignKey: 'dataset_id',
  as: 'preprocessingResults',
  onDelete: 'CASCADE',
});
PreprocessingResult.belongsTo(Dataset, {
  foreignKey: 'dataset_id',
  as: 'dataset',
});

module.exports = {
  sequelize,
  User,
  Dataset,
  PreprocessingResult,
  PreprocessingLog,
  KmeansCluster,
  TimeseriesResult,
};
