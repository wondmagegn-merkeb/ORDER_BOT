const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const AdminAuditLog = require('./AdminAuditLog');

// Import error classes
const {
  InternalServerError,
} = require('../utils/customError');

const saltRounds = 10;

const Admin = sequelize.define('Admin', {
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
  mustChangeCredentials: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetTokenExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
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
  paranoid: true,
  tableName: 'admins'
});

// Before Create
Admin.beforeCreate(async (admin, options) => {
  try {

    // Hash password before saving
    admin.password = await bcrypt.hash(admin.password, saltRounds);
  } catch (err) {
    throw new InternalServerError('Error during admin creation ID or password hash', err);
  }
});


// After Create
Admin.afterCreate(async (admin, options) => {
  try {
    await AdminAuditLog.create({
      action: 'CREATE',
      performedBy: admin.createdBy || 'system',
      newData: admin.toJSON()
    });

    
  } catch (err) {
    console.error('Error in afterCreate hook:', err);
    throw new InternalServerError('Error during admin post-creation tasks (audit log or email).', err);
  }
});

// Before Update
Admin.beforeUpdate(async (admin, options) => {
  try {
    if (admin.changed('password')) {
      admin.password = await bcrypt.hash(admin.password, saltRounds);
    }
  } catch (err) {
    throw new InternalServerError('Error hashing updated password.', err);
  }
});

// After Update
Admin.afterUpdate(async (admin, options) => {
  try {
    await AdminAuditLog.create({
      action: 'UPDATE',
      performedBy: admin.updatedBy || 'system',
      oldData: admin._previousDataValues,
      newData: admin.toJSON()
    });
  } catch (err) {
    throw new InternalServerError('Error logging admin update to audit log.', err);
  }
});

// After Soft Delete
Admin.afterDestroy(async (admin, options) => {
  try {
    await AdminAuditLog.create({
      action: 'DELETE',
      performedBy: admin.updatedBy || 'system',
      oldData: admin.toJSON(),
      newData: null
    });
  } catch (err) {
    throw new InternalServerError('Error logging admin deletion to audit log.', err);
  }
});

module.exports = Admin;
