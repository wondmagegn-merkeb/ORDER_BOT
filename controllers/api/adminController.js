const { Admin, Food, FoodCategory, Order, AdminAuditLog, FoodUpdateLog, FoodCategoryUpdateLog, OrderUpdateLog } = require('../../models/index');
const { NotFoundError, ValidationError, InternalServerError, UnauthorizedError } = require('../../utils/customError');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Op } = require('sequelize');
const sendMail = require('../../utils/mailer');
const { createAdminSchema, loginSchema, updateAdminSchema, forgotPasswordSchema, resetPasswordSchema,updateAdminProfileSchema} = require('../../validators/adminValidator');
const { adminBot } = require('../../bots/adminBot'); 

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
// Helper to generate user update message
const generateAdminUpdateMessage = (user, role, states) => {
  let message = '';

  if (role) {
    if (user.role === 'admin') {
      message += '✅ You are now an <b>Admin</b> and have full access to the system.\n';
    } else if (user.role === 'manager') {
      message += '✅ You are now a <b>Manager</b> and can manage the system.\n';
    } else if (user.role === 'delivery') {
      message += '✅ You are now a <b>Delivery Personnel</b> and can handle delivery tasks.\n';
    } else {
      message += 'ℹ️ Your role has been updated.\n';
    }
  }

  if (states) {
    if (user.states === 'block') {
      message += '⚠️ Your account has been <b>Blocked</b> from accessing the system.';
    } else {
      message += '✅ Your account is now <b>Active</b> and you can use the system.';
    }
  }

  return message;
};


// ✅ Create Admin
exports.createAdmin = async (req, res, next) => {
  const { error } = createAdminSchema.validate(req.body);
  if (error) {
    res.locals.error = error.details[0].message;
    return res.render('admin/create-admin', { title: 'Add Admin' });
  }

  try {
    const { email, telegramId, role } = req.body;

    // Auto-generate username and password based on the role
    let username = '';
    let password = '';

    if (role === 'admin') {
      username = `admin_${Date.now()}`;  // Auto-generated username
      password = `admin_password_${Date.now()}`;  // Unique password for admin
    } else if (role === 'manager') {
      username = `manager_${Date.now()}`;  // Auto-generated username
      password = `manager_password_${Date.now()}`;  // Unique password for manager
    } else if (role === 'delivery') {
      username = `user_${Date.now()}`;  // Auto-generated username
      password = `user_password_${Date.now()}`;  // Unique password for user
    } else {
      // Fallback default values if the role is not specified
      username = `default_username_${Date.now()}`;
      password = `default_password_${Date.now()}`;  // Unique password for fallback role
    }

    // Check if the email already exists
    const existingEmail = await Admin.findOne({ where: { email } });
if (existingEmail) {
  res.locals.error = 'Email already in use';
  return res.render('admin/create-admin', { title: 'Add Admin' });
}

const existingTelegramId = await Admin.findOne({ where: { telegramId } });
if (existingTelegramId) {
  res.locals.error = 'Telegram ID already in use';
  return res.render('admin/create-admin', { title: 'Add Admin' });
}

    // Generate a new admin ID
    const lastAdmin = await Admin.findOne({ order: [['createdAt', 'DESC']],paranoid: false });
    let newIdNumber = 1;
    if (lastAdmin && lastAdmin.adminId) {
      const lastNumber = parseInt(lastAdmin.adminId.replace('ADM', ''));
      newIdNumber = lastNumber + 1;
    }
    const adminId = `ADM${newIdNumber.toString().padStart(3, '0')}`;

    // Send email to the admin with login details
    await sendMail({
      to: email,
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
                  <li><strong>Username:</strong> ${username}</li>
                  <li><strong>Password:</strong> ${password} (set by the system)</li>
                </ul>
              </div>
              <p class="text-gray-600 text-lg mb-8">Please change your password after logging in for the first time.</p>
              <div class="mt-10">
                <a href="${process.env.ADMIN_LOGIN_URL}" class="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
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
    });

    // Create new admin
    const newAdmin = await Admin.create({
      adminId,
      username,
      email,
      password, 
      telegramId,
      createdBy: req.admin.adminId,
      role
    });

    res.locals.success = 'Admin added successfully!';
    res.render('admin/create-admin', { title: 'Add Admin' });
  } catch (err) {
    next(new InternalServerError('Failed to create admin', err));
  }
};


// ✅ Get all admins
exports.getAllAdmins = async () => {
  try {
    const admins = await Admin.findAll({
      attributes: ['adminId', 'username', 'email', 'role', 'states'],
      order: [['createdAt', 'DESC']],
    });

    return admins;
  } catch (err) {
    next(new InternalServerError('Failed to fetch admins', err));
  }
};


// ✅ Get Admin by ID
exports.getAdminById = async (adminId) => {
  try {
    const admin = await Admin.findOne({ where: { adminId } });
    if (!admin) throw new NotFoundError('Admin not found');
    return admin;
  } catch (err) {
    next(new InternalServerError('Failed to fetch admin', err));
  }
};

exports.updateAdminProfile = async (req, res, next) => {
  try {
    const adminId = req.params.id;
    const { username, password } = req.body;

    const admin = await Admin.findOne({ where: { adminId } });
    if (!admin) return next(new NotFoundError('Admin not found'));

    const { error } = updateAdminProfileSchema.validate(req.body);
    if (error) {
      res.locals.error = error.details[0].message;
      return res.render('admin/profile-admin', {
        admin,
        title: 'Admin Profile'
      });
    }

    let credentialsChangedUsername = false;
    let credentialsChangedPassword = false;

    if (password && password.trim() !== '') {
      admin.password = password; // Hash password if required
      credentialsChangedPassword = true;
    }

    if (username && username !== admin.username) {
      admin.username = username;
      credentialsChangedUsername = true;
    }

    if (credentialsChangedUsername && credentialsChangedPassword) {
      admin.mustChangeCredentials = true;
    }

    admin.updatedBy = req.admin.adminId;

    if (credentialsChangedUsername || credentialsChangedPassword) {
      await admin.save();
      res.locals.success = 'Profile updated successfully!';
    }

    return res.render('admin/profile-admin', {
      admin,
      title: 'Admin Profile'
    });

  } catch (err) {
    console.error("Admin profile update error:", err);
    next(new InternalServerError('Failed to update admin', err));
  }
};

// ✅ Update Admin
exports.updateAdmin = async (req, res, next) => {
  try {
    const adminId = req.params.id;
    const { telegramId, role, states, email } = req.body;

    const admin = await Admin.findOne({ where: { adminId } });
    if (!admin) return next(new NotFoundError('Admin not found'));

    const { error } = updateAdminSchema.validate(req.body);
    if (error) {
      res.locals.error = error.details[0].message;
      return res.render('admin/update-admin', {
        admin,
        title: 'Edit Admin'
      });
    }

    // Validate telegramId uniqueness
    if (telegramId && telegramId !== admin.telegramId) {
      const existingTelegramId = await Admin.findOne({
        where: { telegramId, adminId: { [Op.ne]: adminId } }
      });
      if (existingTelegramId) {
        res.locals.error = 'Telegram ID already in use';
        return res.render('admin/update-admin', {
          admin,
          title: 'Edit Admin'
        });
      }
      admin.telegramId = telegramId;
    }

    // Validate email uniqueness
    if (email && email !== admin.email) {
      const existingEmail = await Admin.findOne({ where: { email } });
      if (existingEmail) {
        res.locals.error = 'Email already in use';
        return res.render('admin/update-admin', {
          admin,
          title: 'Edit Admin'
        });
      }
      admin.email = email;
    }

    const originalRole = admin.role;
    const originalStates = admin.states;

    if (states && states !== admin.states) {
      admin.states = states;
    }

    if (role && role !== admin.role) {
      admin.role = role;
    }

    admin.updatedBy = req.admin.adminId;

    const roleChanged = originalRole !== admin.role;
    const statesChanged = originalStates !== admin.states;

    if (roleChanged || statesChanged || telegramId || email) {
      await admin.save();

      if (admin.telegramId && (roleChanged || statesChanged)) {
        const message = generateAdminUpdateMessage(admin, roleChanged, statesChanged);
        await adminBot.telegram.sendMessage(admin.telegramId, message, {
          parse_mode: 'HTML'
        });
      }

      res.locals.success = 'Admin updated successfully!';
    }

    return res.render('admin/update-admin', {
      admin,
      title: 'Edit Admin'
    });

  } catch (err) {
    console.error("Admin update error:", err);
    next(new InternalServerError('Failed to update admin', err));
  }
};


// ✅ Admin login
exports.login = async (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) res.render('login', { error: error.details[0].message, layout: false });

  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ where: { username } });
    if (!admin) return res.render('login', { error: 'Invalid credentials', layout: false });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.render('login', { error: 'Invalid credentials', layout: false });
      

    // Sign JWT token
    const token = jwt.sign(
      { adminId: admin.adminId, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Store only the token in session
    req.session.token = token;
    res.render('login', { success: 'Login successful', layout: false });
    

  } catch (err) {
    next(new InternalServerError('Failed to login', err));
  }
};

// ✅ Forgot password
exports.forgotPassword = async (req, res, next) => {
  const { error } = forgotPasswordSchema.validate(req.body);
  if (error) return next(new ValidationError(error.details[0].message));

  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) return next(new NotFoundError('Email not found'));

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1hr

    admin.resetToken = token;
    admin.resetTokenExpires = expiry;
    admin.updatedBy = admin.adminId;
    await admin.save();

     const baseUrl = process.env.ADMIN_BASE_URL;
     const resetLink = `${baseUrl}/reset-password?token=${token}`;
    
    await sendMail({
      to: admin.email,
      subject: 'Reset Your Password',
      html: `<!DOCTYPE html>
<html lang="en" class="bg-gray-100">
<head>
  <meta charset="UTF-8" />
  <title>Password Reset</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
  <style>
    @keyframes fadeInUp {
      0% {
        opacity: 0;
        transform: translateY(20px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-in-up {
      animation: fadeInUp 0.6s ease-out;
    }
  </style>
</head>
<body class="flex items-center justify-center min-h-screen">
  <div class="bg-white p-10 rounded-2xl shadow-lg text-center max-w-lg w-full animate-fade-in-up">
    
    <!-- Welcome Header -->
    <h1 class="text-4xl font-extrabold text-blue-600 flex items-center justify-center gap-3 mb-3">
      <i class="fas fa-lock"></i> Reset Your Password 🔒
    </h1>
    
    <p class="text-gray-600 text-lg">We received a request to reset your password. If this was not you, you can safely ignore this email.</p>
    <p class="text-gray-600 text-lg mt-4">To reset your password, please click the link below:</p>

    <!-- Reset Password Link -->
    <div class="mt-6">
      <a href="${resetLink}" class="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
        <i class="fas fa-unlock-alt"></i> Reset Password
      </a>
    </div>

    <!-- Additional Info -->
    <div class="mt-8 text-left">
      <h2 class="text-2xl font-semibold text-gray-800 flex items-center gap-2">
        <i class="fas fa-info-circle text-yellow-400"></i> Important:
      </h2>
      <ul class="mt-4 space-y-2 text-gray-700 ml-1">
        <li><i class="fas fa-check-circle text-green-500 mr-2"></i> The reset link is valid for 1 hour.</li>
        <li><i class="fas fa-check-circle text-green-500 mr-2"></i> If you did not request this, no action is needed.</li>
      </ul>
    </div>

    <!-- Login Link -->
    <div class="mt-10">
      <a href="/login" class="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
        <i class="fas fa-sign-in-alt"></i> Login to Your Account
      </a>
    </div>
  </div>
</body>
</html>
`
    });

    res.render('reset-email-sent', { layout: false });
  } catch (err) {
    next(new InternalServerError('Failed to reset email send', err));
  }
};

// ✅ Reset password
exports.resetPassword = async (req, res, next) => {
  const { error } = resetPasswordSchema.validate(req.body);
  if (error) return next(new ValidationError(error.details[0].message));

  try {
    const { token, newPassword } = req.body;

    const admin = await Admin.findOne({
      where: {
        resetToken: token,
        resetTokenExpires: { [Op.gt]: new Date() }
      }
    });

    if (!admin) return next(new UnauthorizedError('Invalid or expired token'));

    admin.password = newPassword;
    admin.resetToken = null;
    admin.resetTokenExpires = null;
    admin.updatedBy = admin.adminId
    await admin.save();

    res.render('login', { message: 'Password reset successful', layout: false  });
  } catch (err) {
    next(new InternalServerError('Failed to reset', err));
  }
};

exports.deleteAdmin = async (req, res, next) => {
  try {
    const adminId = req.params.id;
    const admin = await Admin.findByPk(adminId);
    const admins = await Admin.findAll({
      attributes: ['adminId', 'username', 'email', 'role', 'states'],
      order: [['createdAt', 'DESC']],
    });
    const models = admins;

    const modelColumns = [
      { name: 'Admin ID', field: 'adminId', index: 0 },
      { name: 'Username', field: 'username', index: 1 },
      { name: 'Email', field: 'email', index: 2 },
      { name: 'Role', field: 'role', index: 3 },
      { name: 'Status', field: 'states', index: 4 }
    ];

    const filters = [
      { id: 'admin', name: 'Admin', value: 'admin', colorClass: 'bg-yellow-500 hover:bg-yellow-600' },
      { id: 'manager', name: 'Manager', value: 'manager', colorClass: 'bg-indigo-600 hover:bg-indigo-700' },
      { id: 'delivery', name: 'Delivery Staff', value: 'delivery', colorClass: 'bg-blue-600 hover:bg-blue-700' },
      { id: 'active', name: 'Active', value: 'Active', colorClass: 'bg-green-500 hover:bg-green-600' },
      { id: 'block', name: 'Block', value: 'block', colorClass: 'bg-pink-400 hover:bg-pink-500' }
    ];

    if (!admin) {
      return next(new NotFoundError('Admin not found'));
    }

    // Check if Admin is referenced in other records
    const [
      foodCreated,
      foodUpdated,
      foodCategoryCreated,
      foodCategoryUpdated,
      foodUpdateLog,
      foodCategoryUpdateLog,
      orderUpdated,
      adminAuditLog,
      orderUpdateLog
    ] = await Promise.all([
      Food.findOne({ where: { createdBy: adminId } }),
      Food.findOne({ where: { updatedBy: adminId } }),
      FoodCategory.findOne({ where: { createdBy: adminId } }),
      FoodCategory.findOne({ where: { updatedBy: adminId } }),
      FoodUpdateLog.findOne({ where: { performedBy: adminId } }),
      FoodCategoryUpdateLog.findOne({ where: { performedBy: adminId } }),
      Order.findOne({ where: { updatedBy: adminId } }),
      AdminAuditLog.findOne({ where: { performedBy: adminId } }),
      OrderUpdateLog.findOne({ where: { performedBy: adminId } })
    ]);

    if (
      foodCreated || foodUpdated || foodCategoryCreated || foodCategoryUpdated ||
      foodUpdateLog || foodCategoryUpdateLog || orderUpdated || adminAuditLog || orderUpdateLog
    ) {
      const admins = await Admin.findAll({
      attributes: ['adminId', 'username', 'email', 'role', 'states'],
      order: [['createdAt', 'DESC']],
    });
    const models = admins;
      res.locals.error = 'Cannot delete admin. Admin is referenced in other records.';
      return res.render('admin/list-admin', {
        title: 'Admin List',
        models,
        modelColumns,
        filters,
        modelName: 'Admin',
        modelNameLower: 'admin',
        permissions: {
          canView: false,
          canAdd: true,
          canEdit: true,
          canDelete: true
        }
      });
    }

    // No references, safe to delete
    admin.updatedBy = req.admin.adminId;
    await admin.destroy();
    const admins = await Admin.findAll({
      attributes: ['adminId', 'username', 'email', 'role', 'states'],
      order: [['createdAt', 'DESC']],
    });
    const models = admins;
    res.locals.success = 'Admin deleted successfully!';
    return res.render('admin/list-admin', {
      title: 'Admin List',
      models,
      modelColumns,
      filters,
      modelName: 'Admin',
      modelNameLower: 'admin',
      permissions: {
        canView: false,
        canAdd: true,
        canEdit: true,
        canDelete: true
      }
    });
    
  } catch (error) {
    next(new InternalServerError('Failed to delete admin', error));
  }
};


