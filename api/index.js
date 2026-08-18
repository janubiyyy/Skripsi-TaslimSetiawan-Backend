/**
 * api/index.js — Vercel Serverless Function Handler
 */

const app = require('../src/app');

let dbInitialized = false;

async function ensureDbSynced() {
  if (dbInitialized) return;
  dbInitialized = true;
  try {
    const { syncDatabase } = require('../src/config/database');
    await syncDatabase();
  } catch (err) {
    console.error('Vercel DB sync error:', err.message);
  }
}

module.exports = async (req, res) => {
  await ensureDbSynced();
  return app(req, res);
};
