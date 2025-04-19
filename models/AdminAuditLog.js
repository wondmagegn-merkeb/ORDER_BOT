const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// ✅ Audit log for Admin actions with old and new data
const AdminAuditLog = sequelize.define('AdminAuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  action: {
    type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE'),
    allowNull: false
  },
  performedBy: {
    type: DataTypes.STRING,
    allowNull: true // admin id
  },
  oldData: {
    type: DataTypes.JSON,
    allowNull: true // old data before update
  },
  newData: {
    type: DataTypes.JSON,
    allowNull: true // new data after update
  }
}, {
  timestamps: true,
  tableName: 'admin_audit_logs'
});

module.exports = AdminAuditLog;
