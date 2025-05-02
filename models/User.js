const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const UserUpdateLog = require('./UserUpdateLog');
const { InternalServerError } = require('../utils/customError'); // Import custom error

// ✅ Define User Model
const User = sequelize.define('User', {
  userId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true
  },
  telegramId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phoneNumber1: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phoneNumber2: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active' // active, blocked, etc.
  },
  userType: {
    type: DataTypes.STRING,
    defaultValue: 'guest' // customer, guest, VIP, etc.
  },
  updatedBy: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  paranoid: true, // Enable soft delete
  tableName: 'users'
});

// 🔁 Hook: afterUpdate – log changes
User.afterUpdate(async (user, options) => {
  try {
    await UserUpdateLog.create({
      userId: user.userId,
      action: 'UPDATE',
      performedBy: user.updatedBy || 'system',
      oldData: user._previousDataValues,
      newData: user.toJSON(),
    });
  } catch (error) {
    throw new InternalServerError('Failed to log user update', error);
  }
});

module.exports = User;
