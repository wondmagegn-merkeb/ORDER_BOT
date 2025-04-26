const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// ✅ Logs only status/userType changes made by admins
const UserUpdateLog = sequelize.define('UserUpdateLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false // Reference to User.userId
  },
  oldData: {
    type: DataTypes.JSON,
    allowNull: true // old data before update
  },
  newData: {
    type: DataTypes.JSON,
    allowNull: true // new data after update
  },
  action: {
    type: DataTypes.ENUM('UPDATE'),
    allowNull: false
  },
  performedBy: {
    type: DataTypes.STRING, // adminId who made the change
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'user_update_logs'
});

module.exports = UserUpdateLog;
