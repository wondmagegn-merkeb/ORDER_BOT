const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcrypt');
const AdminAuditLog = require('./AdminAuditLog');

// Import custom error classes
const { InternalServerError } = require('../utils/customError');

const saltRounds = 10;

const Admin = sequelize.define('Admin', {
  adminId: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telegramId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  states: {
    type: DataTypes.STRING,
    defaultValue: 'active',
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'admin',
  },
  mustChangeCredentials: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  endpoint: {
    type: DataTypes.STRING,
    allowNull: true
  },
  expirationTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  keys: {
    type: DataTypes.JSON,
    allowNull: true
  },
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetTokenExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  updatedBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  paranoid: true,
  tableName: 'admins',
});

// ==================== Hooks ====================

// Before Create: Hash password
Admin.beforeCreate(async (admin) => {
  try {
    admin.password = await bcrypt.hash(admin.password, saltRounds);
  } catch (err) {
    throw new InternalServerError('Error during admin creation (ID or password hash)', err);
  }
});

// After Create: Audit log
Admin.afterCreate(async (admin) => {
  try {
    await AdminAuditLog.create({
      action: 'CREATE',
      performedBy: admin.createdBy || 'system',
      newData: admin.toJSON(),
    });
  } catch (err) {
    console.error('Error in afterCreate hook:', err);
    throw new InternalServerError('Error during admin post-creation tasks (audit log).', err);
  }
});

// Before Update: Re-hash password if changed
Admin.beforeUpdate(async (admin) => {
  try {
    if (admin.changed('password')) {
      admin.password = await bcrypt.hash(admin.password, saltRounds);
    }
  } catch (err) {
    throw new InternalServerError('Error hashing updated password.', err);
  }
});

// After Update: Audit log
Admin.afterUpdate(async (admin) => {
  try {
    await AdminAuditLog.create({
      action: 'UPDATE',
      performedBy: admin.updatedBy || 'system',
      oldData: admin._previousDataValues,
      newData: admin.toJSON(),
    });
  } catch (err) {
    throw new InternalServerError('Error logging admin update to audit log.', err);
  }
});

// After Soft Delete: Audit log
Admin.afterDestroy(async (admin) => {
  try {
    await AdminAuditLog.create({
      action: 'DELETE',
      performedBy: admin.updatedBy || 'system',
      oldData: admin.toJSON(),
      newData: null,
    });
  } catch (err) {
    throw new InternalServerError('Error logging admin deletion to audit log.', err);
  }
});

module.exports = Admin;
