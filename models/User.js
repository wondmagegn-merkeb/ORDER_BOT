const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const UserUpdateLog = require('./UserUpdateLog'); // Import the log model

// ✅ User Model
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
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active' // active, blocked, etc.
  },
  userType: {
    type: DataTypes.STRING,
    defaultValue: 'customer' // customer, guest, VIP, etc.
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

// 🔁 Hook: Before Create – generate custom ID like USR001
User.beforeCreate(async (user, options) => {
  const lastUser = await User.findOne({
    order: [['createdAt', 'DESC']]
  });

  let newIdNumber = 1;

  if (lastUser && lastUser.userId) {
    const lastNumber = parseInt(lastUser.userId.replace('USR', ''));
    newIdNumber = lastNumber + 1;
  }

  user.userId = 'USR' + String(newIdNumber).padStart(3, '0');
});

// 🔁 Hook: after Update – log changes to `status` or `userType`
User.afterUpdate(async (user, options) => {
  const previous = await User.findOne({ where: { userId: user.userId } });

  // Check if 'status' changed
  if (user.changed('status')) {
    await UserUpdateLog.create({
      userId: user.userId,
      field: 'status',
      oldValue: previous.status,
      newValue: user.status,
      performedBy: user.updatedBy || 'system'
    });
  }

  // Check if 'userType' changed
  if (user.changed('userType')) {
    await UserUpdateLog.create({
      userId: user.userId,
      field: 'userType',
      oldValue: previous.userType,
      newValue: user.userType,
      performedBy: user.updatedBy || 'system'
    });
  }
});

module.exports = User;
