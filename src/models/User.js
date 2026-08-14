/**
 * src/models/User.js
 *
 * Tabel: users
 * Menyimpan data akun pengguna sistem (admin / viewer)
 */

const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

class User extends Model {
  /**
   * Verifikasi password plain text dengan hash di database
   * @param {string} password
   * @returns {boolean}
   */
  async validatePassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }

  /**
   * Hilangkan field sensitif saat serialisasi ke JSON
   */
  toJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        name: 'unique_username',
        msg: 'Username sudah digunakan.',
      },
      validate: {
        notEmpty: { msg: 'Username tidak boleh kosong.' },
        len: {
          args: [3, 100],
          msg: 'Username harus 3-100 karakter.',
        },
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'viewer'),
      allowNull: false,
      defaultValue: 'viewer',
    },
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    hooks: {
      // Hash password sebelum create atau update
      beforeCreate: async (user) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password_hash')) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
      },
    },
  }
);

module.exports = User;
