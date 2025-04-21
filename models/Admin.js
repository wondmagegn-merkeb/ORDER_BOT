const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const AdminAuditLog = require('./AdminAuditLog'); // Import log model

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
    defaultValue: true // Forces change on first login
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
  console.log(admin);
});

// 🔁 Hook: After Create — log to audit and send email
Admin.afterCreate(async (admin, options) => {
  // Audit log
  await AdminAuditLog.create({
    action: 'CREATE',
    performedBy: admin.createdBy || 'system', // Log admin who performed the action
    newData: admin.toJSON() // Save the new data after creation
  });

  // Send email with username and password to the admin
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to any email service provider
      auth: {
        user: 'wondmagegnmerkebbeleka@gmail.com', // Your email address
        pass: 'jfwp dcrm khrm ypsd' // Your email password or app-specific password
      }
    });

    const mailOptions = {
      from: 'wondmagegnmerkebbeleka@gmail.com',
      to: admin.email, // Admin's email from the DB
      subject: 'Your Admin Account Details',
      text: `Hello ${admin.username},\n\nYour admin account has been created.\n\nUsername: ${admin.username}\nPassword: Your Password (set by the system)\n\nPlease change your password after logging in for the first time.\n\nBest regards,\nYour Team`
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to ' + admin.email);
  } catch (error) {
    console.error('Error sending email:', error);
  }
});

// 🔁 Hook: Before Update — rehash password if changed
Admin.beforeUpdate(async (admin, options) => {
  if (admin.changed('password')) {
    admin.password = await bcrypt.hash(admin.password, saltRounds);
  }
});

// 🔁 Hook: After Update — log to audit
Admin.afterUpdate(async (admin, options) => {
  const oldData = admin._previousDataValues;
  const newData = admin.toJSON();

  await AdminAuditLog.create({
    action: 'UPDATE',
    performedBy: admin.updatedBy || 'system',
    oldData: oldData,
    newData: newData
  });
});

// 🔁 Hook: After Soft Delete — log to audit
Admin.afterDestroy(async (admin, options) => {
  const oldData = admin.toJSON();

  await AdminAuditLog.create({
    action: 'DELETE',
    performedBy: admin.updatedBy || 'system',
    oldData: oldData,
    newData: null
  });
});

module.exports = Admin;
