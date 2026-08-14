/**
 * api/index.js — Vercel Serverless Handler for skripsi-backend
 */

const app = require('../src/app');
const { syncDatabase } = require('../src/config/database');

let isSynced = false;

module.exports = async (req, res) => {
  if (!isSynced) {
    try {
      await syncDatabase();
      isSynced = true;
    } catch (err) {
      console.error('Database sync error on Vercel serverless init:', err.message);
    }
  }
  return app(req, res);
};
