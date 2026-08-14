/**
 * server.js — Entry point aplikasi
 * Menjalankan HTTP server dan menginisialisasi koneksi database
 */

require('dotenv').config();
const app = require('./src/app');
const { testConnection, syncDatabase } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test & sync database
    await testConnection();
    await syncDatabase();

    app.listen(PORT, () => {
      console.log(`\n🚀 Server berjalan di http://localhost:${PORT}`);
      console.log(`📊 Skripsi: Analisis Pola Lalu Lintas Lebaran`);
      console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰  Started: ${new Date().toLocaleString('id-ID')}\n`);
    });
  } catch (error) {
    console.error('❌ Gagal menjalankan server:', error.message);
    process.exit(1);
  }
};

startServer();
