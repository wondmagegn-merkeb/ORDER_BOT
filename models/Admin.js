const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const AdminAuditLog = require('./AdminAuditLog'); // Import log model

const Admin = sequelize.define('Admin', {
  // Custom string ID, e.g., ADM001
  adminId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telegramId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  states: {
    type: DataTypes.STRING,
    defaultValue: 'active'
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'admin'
  },
  // Audit fields
  createdBy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  updatedBy: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  paranoid: true, // enables soft delete (deletedAt)
  tableName: 'admins'
});

// 🔁 Hook: Before Create — generate ID and hash password
Admin.beforeCreate(async (admin, options) => {
  const lastAdmin = await Admin.findOne({ order: [['createdAt', 'DESC']] });

  let newIdNumber = 1;
  if (lastAdmin && lastAdmin.adminId) {
    const lastNumber = parseInt(lastAdmin.adminId.replace('ADM', ''));
    newIdNumber = lastNumber + 1;
  }

  admin.adminId = 'ADM' + String(newIdNumber).padStart(3, '0');
  admin.password = await bcrypt.hash(admin.password, saltRounds);
});

// 🔁 Hook: Before Update — rehash password if changed
Admin.beforeUpdate(async (admin, options) => {
  if (admin.changed('password')) {
    admin.password = await bcrypt.hash(admin.password, saltRounds);
  }
});

// 🔁 Hook: After Create — log to audit
Admin.afterCreate(async (admin, options) => {
  await AdminAuditLog.create({
    adminId: admin.adminId,
    action: 'CREATE',
    performedBy: admin.createdBy || 'system',
    snapshot: admin.toJSON()
  });
});

// 🔁 Hook: After Update — log to audit
Admin.afterUpdate(async (admin, options) => {
  await AdminAuditLog.create({
    adminId: admin.adminId,
    action: 'UPDATE',
    performedBy: admin.updatedBy || 'system',
    snapshot: admin.toJSON()
  });
});

// 🔁 Hook: After Soft Delete — log to audit
Admin.afterDestroy(async (admin, options) => {
  await AdminAuditLog.create({
    adminId: admin.adminId,
    action: 'DELETE',
    performedBy: admin.updatedBy || 'system',
    snapshot: admin.toJSON()
  });
});

module.exports = Admin;
