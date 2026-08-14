/**
 * src/config/env.js — Validasi environment variables saat startup
 */

const requiredVars = [
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
];

const validateEnv = () => {
  const missing = requiredVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Environment variable berikut tidak terdefinisi: ${missing.join(', ')}`);
    console.error('   Pastikan file .env sudah dibuat dari .env.example');
    process.exit(1);
  }
};

module.exports = { validateEnv };
