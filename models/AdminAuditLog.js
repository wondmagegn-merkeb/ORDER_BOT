const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

// ✅ Audit log for Admin actions
const AdminAuditLog = sequelize.define('AdminAuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  adminId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  action: {
    type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE'),
    allowNull: false
  },
  performedBy: {
    type: DataTypes.STRING,
    allowNull: true // admin username or system
  },
  snapshot: {
    type: DataTypes.JSON,
    allowNull: true // full data snapshot at the time of change
  }
}, {
  timestamps: true,
  tableName: 'admin_audit_logs'
});

module.exports = AdminAuditLog;
