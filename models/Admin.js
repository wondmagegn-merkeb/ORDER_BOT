const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
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
  resetToken: {
  type: DataTypes.STRING,
  allowNull: true
},
resetTokenExpires: {
  type: DataTypes.DATE,
  allowNull: true
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
    action: 'CREATE',
    performedBy: admin.createdBy || 'system',  // Log admin who performed the action
    newData: admin.toJSON() // Save the new data after creation
  });
});

// 🔁 Hook: After Update — log to audit
Admin.afterUpdate(async (admin, options) => {
  const oldData = admin._previousDataValues; // Get the old data before update
  const newData = admin.toJSON(); // Get the new data after update

  await AdminAuditLog.create({
    action: 'UPDATE',
    performedBy: admin.updatedBy || 'system',  // Log admin who performed the action
    oldData: oldData,  // Log the old data
    newData: newData   // Log the new data
  });
});

// 🔁 Hook: After Soft Delete — log to audit
Admin.afterDestroy(async (admin, options) => {
  const oldData = admin.toJSON(); // Before deletion, log the old data

  await AdminAuditLog.create({
    action: 'DELETE',
    performedBy: admin.updatedBy || 'system',  // Log admin who performed the action
    oldData: oldData,  // Log the old data (before delete)
    newData: null      // No new data as the record is deleted
  });
});

module.exports = Admin;
