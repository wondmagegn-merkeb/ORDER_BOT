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

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'wondmagegnmerkebbeleka@gmail.com',
        pass: 'jfwp dcrm khrm ypsd'
      }
    });

    const mailOptions = {
  from: 'wondmagegnmerkebbeleka@gmail.com',
  to: admin.email,
  subject: 'Your Admin Account Details',
  html: `
    <html>
      <head>
        <title>Admin Account Details</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
        <style>
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }

          .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out;
          }
        </style>
      </head>
      <body class="flex items-center justify-center min-h-screen">
        <div class="bg-white p-10 rounded-2xl shadow-lg text-center max-w-lg w-full animate-fade-in-up">
          <h1 class="text-4xl font-extrabold text-blue-600 flex items-center justify-center gap-3 mb-3">
            <i class="fas fa-hand-peace"></i> Welcome 🎉
          </h1>
          <p class="text-gray-600 text-lg mb-4">Your admin account has been successfully created. Please find your login details below:</p>
          <div class="text-left mb-6">
            <h2 class="text-2xl font-semibold text-gray-800 mb-2">
              <i class="fas fa-user-cog text-blue-600"></i> Admin Account Details:
            </h2>
            <ul class="space-y-2 text-gray-700">
              <li><strong>Username:</strong> ${admin.username}</li>
              <li><strong>Password:</strong> ${admin.password} (set by the system)</li>
            </ul>
          </div>
          <p class="text-gray-600 text-lg mb-8">Please change your password after logging in for the first time.</p>
          <div class="mt-10">
            <a href="/admin" class="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
              <i class="fas fa-sign-in-alt"></i> Login to Get Started
            </a>
          </div>
          <div class="mt-12 text-gray-500 text-sm">
            <p>Best regards,</p>
            <p>Your Team</p>
          </div>
        </div>
      </body>
    </html>
  `
};


    await transporter.sendMail(mailOptions);
    console.log('Email sent to ' + admin.email);
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
