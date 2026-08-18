/**
 * src/config/database.js — Universal Sequelize Database connection handler
 */

const { Sequelize } = require('sequelize');

// Safe pure-JS SQLite driver mock for Vercel Serverless Function environment
function createSqlite3Polyfill() {
  class DummyDatabase {
    constructor(filename, mode, callback) {
      const cb = typeof mode === 'function' ? mode : callback;
      if (typeof cb === 'function') setImmediate(() => cb(null));
    }
    all(sql, params, callback) {
      const cb = typeof params === 'function' ? params : callback;
      if (typeof cb === 'function') setImmediate(() => cb(null, []));
    }
    run(sql, params, callback) {
      const cb = typeof params === 'function' ? params : callback;
      if (typeof cb === 'function') {
        setImmediate(() => cb.call({ lastID: 1, changes: 1 }, null));
      }
    }
    get(sql, params, callback) {
      const cb = typeof params === 'function' ? params : callback;
      if (typeof cb === 'function') setImmediate(() => cb(null, null));
    }
    close(callback) {
      if (typeof callback === 'function') setImmediate(() => callback(null));
    }
    serialize(callback) {
      if (typeof callback === 'function') callback();
    }
    exec(sql, callback) {
      if (typeof callback === 'function') setImmediate(() => callback(null));
    }
  }

  return {
    Database: DummyDatabase,
    verbose: () => createSqlite3Polyfill(),
    OPEN_READWRITE: 1,
    OPEN_CREATE: 2,
    OPEN_FULLMUTEX: 4,
    OPEN_READONLY: 8,
  };
}

let sqlite3Driver;
try {
  sqlite3Driver = require('sqlite3');
} catch (e) {
  sqlite3Driver = createSqlite3Polyfill();
}

const isSQLite = !process.env.DB_HOST || process.env.DB_DIALECT === 'sqlite';
const sqliteStorage = process.env.VERCEL ? ':memory:' : (process.env.DB_STORAGE || '/tmp/skripsi_lalin.sqlite');

const sequelize = isSQLite
  ? new Sequelize({
      dialect: 'sqlite',
      storage: sqliteStorage,
      dialectModule: sqlite3Driver,
      logging: false,
    })
  : new Sequelize(
      process.env.DB_NAME || 'skripsi',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        dialect: 'mysql',
        logging: false,
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
        timezone: '+07:00',
      }
    );

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
  } catch (error) {
    console.error('❌ Gagal sync database:', error.message);
  }
};

module.exports = { sequelize, testConnection, syncDatabase };
