/**
 * src/services/auth.service.js
 * Business logic untuk autentikasi
 */

const { User } = require('../models');
const { signToken } = require('../utils/jwt');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Login — validasi credentials dan return token
 * @param {string} username
 * @param {string} password
 * @returns {{ user: User, token: string }}
 */
const login = async (username, password) => {
  if (!username || !password) {
    throw new AppError('Username dan password wajib diisi.', 400);
  }

  // Cari user (termasuk password_hash untuk validasi)
  const user = await User.scope(null).findOne({
    where: { username },
    // Override toJSON agar password_hash tersedia sementara
    attributes: ['id', 'username', 'password_hash', 'role'],
  });

  if (!user) {
    throw new AppError('Username atau password salah.', 401);
  }

  const isPasswordValid = await user.validatePassword(password);
  if (!isPasswordValid) {
    throw new AppError('Username atau password salah.', 401);
  }

  const token = signToken({
    id: user.id,
    username: user.username,
    role: user.role,
  });

  return {
    user: user.toJSON(), // password_hash sudah di-strip di sini
    token,
  };
};

/**
 * Get current authenticated user by ID
 */
const getUserById = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new AppError('User tidak ditemukan.', 404);
  }
  return user;
};

/**
 * Change password untuk user yang sedang login
 */
const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.scope(null).findOne({
    where: { id: userId },
    attributes: ['id', 'username', 'password_hash', 'role'],
  });

  if (!user) {
    throw new AppError('User tidak ditemukan.', 404);
  }

  const isValid = await user.validatePassword(oldPassword);
  if (!isValid) {
    throw new AppError('Password lama tidak sesuai.', 400);
  }

  user.password_hash = newPassword; // Akan di-hash di Sequelize hook beforeUpdate
  await user.save();

  return { message: 'Password berhasil diubah.' };
};

module.exports = { login, getUserById, changePassword };
