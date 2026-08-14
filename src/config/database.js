/**
 * src/config/database.js — Sequelize MySQL connection
 */

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
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
    await sequelize.sync({ alter: isDev });
    console.log('✅ Database sync selesai.');
  } catch (error) {
    console.error('❌ Gagal sync database:', error.message);
    throw error;
  }
};

module.exports = { sequelize, testConnection, syncDatabase };
