/**
 * src/config/database.js — Sequelize MySQL connection
 */

const { Sequelize } = require('sequelize');

const isSQLite = !process.env.DB_HOST || process.env.DB_DIALECT === 'sqlite';

const sequelize = isSQLite
  ? new Sequelize({
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || '/tmp/skripsi_lalin.sqlite',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        dialectOptions: {
          socketPath: process.env.DB_SOCKET || undefined,
        },
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        define: {
          timestamps: true,
          underscored: false,
          freezeTableName: true,
        },
        timezone: '+07:00', // WIB
      }
    );

/**
 * Test koneksi database
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Koneksi database berhasil.');
  } catch (error) {
    console.error('❌ Tidak bisa konek ke database:', error.message);
    throw error;
  }
};

/**
 * Sync semua model ke database
 * alter: true → update table jika ada perubahan (dev only)
 * force: true → drop & recreate (HATI-HATI di production!)
 */
const syncDatabase = async () => {
  const isDev = process.env.NODE_ENV === 'development';
  try {
    await sequelize.sync();
    console.log('✅ Database sync selesai.');

    // Auto seed admin user jika belum ada user sama sekali
    const { User, Dataset, TimeseriesResult } = require('../models');
    const userCount = await User.count();
    if (userCount === 0) {
      const { hashPassword } = require('../utils/hash');
      const hash = await hashPassword('Admin@123');
      await User.create({
        username: 'admin',
        password_hash: hash,
        role: 'admin',
      });
      console.log('✅ User admin awal berhasil dibuat.');
    }

    // Auto populate pipeline results (preprocessing, kmeans, timeseries) if empty
    const tsCount = await TimeseriesResult.count();
    const datasetCount = await Dataset.count();
    if (datasetCount > 0 && tsCount === 0) {
      try {
        const preprocessingService = require('../services/preprocessing.service');
        const kmeansService = require('../services/kmeans.service');
        const timeseriesService = require('../services/timeseries.service');
        await preprocessingService.runMinMaxScaling();
        await kmeansService.runClustering(3);
        await timeseriesService.generateAndSave();
        console.log('✅ Auto-pipeline execution completed on database startup.');
      } catch (pipeErr) {
        console.warn('⚠️ Auto-pipeline warning:', pipeErr.message);
      }
    }
  } catch (error) {
    console.error('❌ Gagal sync database:', error.message);
    throw error;
  }
};

module.exports = { sequelize, testConnection, syncDatabase };
