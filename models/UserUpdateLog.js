const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

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
  field: {
    type: DataTypes.ENUM('status', 'userType'), // What field changed
    allowNull: false
  },
  oldValue: {
    type: DataTypes.STRING,
    allowNull: true
  },
  newValue: {
    type: DataTypes.STRING,
    allowNull: false
  },
  updatedBy: {
    type: DataTypes.STRING, // adminId who made the change
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'user_update_logs'
});

module.exports = UserUpdateLog;
