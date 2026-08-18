/**
 * src/config/database.js — Sequelize Database connection handler
 */

const { Sequelize } = require('sequelize');

let sequelize;

try {
  const isSQLite = !process.env.DB_HOST || process.env.DB_DIALECT === 'sqlite';
  const sqliteStorage = process.env.VERCEL ? ':memory:' : (process.env.DB_STORAGE || '/tmp/skripsi_lalin.sqlite');

  if (isSQLite) {
    const sqlite3 = require('sqlite3');
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: sqliteStorage,
      dialectModule: sqlite3,
      logging: false,
    });
  } else {
    sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        dialect: 'mysql',
        logging: false,
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
        timezone: '+07:00',
      }
    );
  }
} catch (err) {
  console.error('⚠️ Error initializing Sequelize instance:', err.message);
  try {
    const sqlite3 = require('sqlite3');
    sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', dialectModule: sqlite3, logging: false });
  } catch (e) {
    console.error('⚠️ SQLite fallback error:', e.message);
  }
}

/**
 * Test koneksi database
 */
const testConnection = async () => {
  try {
    if (sequelize) await sequelize.authenticate();
    console.log('✅ Koneksi database berhasil.');
  } catch (error) {
    console.error('❌ Tidak bisa konek ke database:', error.message);
  }
};

/**
 * Sync semua model ke database
 */
const syncDatabase = async () => {
  try {
    if (!sequelize) return;
    await sequelize.sync();
    console.log('✅ Database sync selesai.');

    // Auto seed admin user jika belum ada user sama sekali
    const { User } = require('../models');
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
  } catch (error) {
    console.error('❌ Gagal sync database:', error.message);
  }
};

module.exports = { sequelize, testConnection, syncDatabase };
