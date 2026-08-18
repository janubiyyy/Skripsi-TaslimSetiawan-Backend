/**
 * api/index.js — Diagnostic Handler for Vercel Serverless Function
 */

module.exports = (req, res) => {
  try {
    const app = require('../src/app');
    return app(req, res);
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Vercel Serverless Init Error',
      error: error.message,
      stack: error.stack,
    });
  }
};
