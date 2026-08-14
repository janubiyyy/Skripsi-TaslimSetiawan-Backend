/**
 * api/index.js — Non-blocking Vercel Serverless Handler
 */

const app = require('../src/app');

let initDone = false;

async function initDb() {
  if (initDone) return;
  initDone = true;
  try {
    const { syncDatabase } = require('../src/config/database');
    await syncDatabase();
    console.log('✅ Serverless DB init completed.');
  } catch (err) {
    console.error('⚠️ Serverless DB init error (non-fatal):', err.message);
  }
}

module.exports = (req, res) => {
  // Run DB init asynchronously without blocking response
  initDb().catch((e) => console.error(e));
  return app(req, res);
};
