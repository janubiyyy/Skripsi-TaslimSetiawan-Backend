/**
 * src/app.js — Express app configuration
 * Setup middleware global, CORS, helmet, routing
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const routes = require('./routes/index');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ── 1. CORS Middleware (FIRST BEFORE HELMET) ─────────────────────────────
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin',
                   'Bypass-Tunnel-Remainder', 'ngrok-skip-browser-warning'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── 2. Security Headers ──────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));

// ── Rate Limiting ─────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Terlalu banyak permintaan, coba lagi nanti.',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    status: 'error',
    message: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit.',
  },
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// ── Body Parser ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logger ────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Root & Health Check ──────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Skripsi Lalin Backend API Online',
    endpoints: {
      health: '/health',
      auth: '/api/auth/login',
      datasets: '/api/datasets',
      preprocessing: '/api/preprocessing/stats',
      kmeans: '/api/kmeans/results',
      timeseries: '/api/timeseries/summary',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'Skripsi Lalin Backend',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 Handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route tidak ditemukan: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global Error Handler ──────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
