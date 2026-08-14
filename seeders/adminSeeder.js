/**
 * seeders/adminSeeder.js
 * Seed user admin awal ke database.
 *
 * Jalankan: node seeders/adminSeeder.js
 * atau:      npm run seed
 */

require('dotenv').config();
const { sequelize, testConnection, syncDatabase } = require('../src/config/database');

// Import models agar relasi terdaftar
const { User } = require('../src/models');

const seedAdmin = async () => {
  try {
    console.log('🌱 Memulai proses seeding...');

    await testConnection();
    await syncDatabase();

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    // Cek apakah admin sudah ada
    const existing = await User.findOne({ where: { username: adminUsername } });

    if (existing) {
      console.log(`ℹ️  User admin "${adminUsername}" sudah ada. Skip seeding.`);
    } else {
      await User.create({
        username: adminUsername,
        password_hash: adminPassword, // akan di-hash oleh Sequelize hook
        role: 'admin',
      });
      console.log(`✅ User admin "${adminUsername}" berhasil dibuat.`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   ⚠️  Segera ubah password setelah login pertama!`);
    }

    // Seed viewer sample (opsional)
    const viewerExisting = await User.findOne({ where: { username: 'viewer' } });
    if (!viewerExisting) {
      await User.create({
        username: 'viewer',
        password_hash: 'Viewer@123',
        role: 'viewer',
      });
      console.log(`✅ User viewer "viewer" berhasil dibuat (password: Viewer@123).`);
    }

    console.log('\n🎉 Seeding selesai!');
  } catch (error) {
    console.error('❌ Seeding gagal:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

seedAdmin();
