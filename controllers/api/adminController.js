const { Admin } = require('../../models/index');
const { NotFoundError, ValidationError, InternalServerError, UnauthorizedError } = require('../../utils/customError');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const sendMail = require('../../utils/mailer');
const { createAdminSchema, loginSchema, updateAdminSchema, forgotPasswordSchema, resetPasswordSchema } = require('../../validators/adminValidator');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// ✅ Create Admin
exports.createAdmin = async (req, res, next) => {
  const { error } = createAdminSchema.validate(req.body);
  if (error) {
    return next(new ValidationError(error.details[0].message));
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
} else if (role === 'user') {
  username = `user_${Date.now()}`;  // Auto-generated username
  password = `user_password_${Date.now()}`;  // Unique password for user
} else {
  // Fallback default values if the role is not specified
  username = `default_username_${Date.now()}`;
  password = `default_password_${Date.now()}`;  // Unique password for fallback role
}


    const existing = await Admin.findOne({ where: { email } });
    if (existing) {
      return next(new ConflictError('Email already in use'));
    }

    const lastAdmin = await Admin.findOne({ order: [['createdAt', 'DESC']] });

    let newIdNumber = 1;
    if (lastAdmin && lastAdmin.adminId) {
      const lastNumber = parseInt(lastAdmin.adminId.replace('ADM', ''));
      newIdNumber = lastNumber + 1;
    }

    const adminId = `ADM${newIdNumber.toString().padStart(3, '0')}`;
    
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

    const newAdmin = await Admin.create({
      adminId,
      username,
      email,
      password,  // Save the hashed password
      telegramId,
      createdBy: req.admin.adminId,
      role
    });

    res.locals.success = 'Admin added successfully!';
    res.render('admin/create-admin', { title: 'Add Admin' });
  } catch (err) {
    return next(new InternalServerError(err.message));
  }
};


// ✅ Get all admins
exports.getAllAdmins = async () => {
  try {
    const admins = await Admin.findAll({ order: [['createdAt', 'DESC']] });
    return admins;
  } catch (err) {
    throw new InternalServerError(err.message);
  }
};

// ✅ Get Admin by ID
exports.getAdminById = async (adminId) => {
  try {
    const admin = await Admin.findOne({ where: { adminId } });
    if (!admin) throw new NotFoundError('Admin not found');
    return admin;
  } catch (err) {
    throw new InternalServerError(err.message);
  }
};

// ✅ Update Admin
exports.updateAdmin = async (req, res, next) => {
  const { error } = updateAdminSchema.validate(req.body);
  if (error) return next(new ValidationError(error.details[0].message));

  try {
    const { adminId } = req.params;
    const { username, email, password, telegramId, updatedBy, role, states } = req.body;

    const admin = await Admin.findOne({ where: { adminId } });
    if (!admin) return next(new NotFoundError('Admin not found'));

    if (username) admin.username = username;
    if (email) admin.email = email;
    if (password) admin.password = password;  // Using plain password
    if (telegramId) admin.telegramId = telegramId;
    if (states) admin.states = states;
    if (role) admin.role = role;
    admin.updatedBy = updatedBy;

    await admin.save();
    res.redirect(`/admins/${adminId}`);
  } catch (err) {
    return next(new InternalServerError(err.message));
  }
};

// ✅ Admin login
exports.login = async (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return next(new ValidationError(error.details[0].message));

  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ where: { username } });
    if (!admin) return next(new NotFoundError('Admin not found'));

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return next(new UnauthorizedError('Invalid credentials'));

    // Sign JWT token
    const token = jwt.sign(
      { adminId: admin.adminId, role: admin.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    // Store only the token in session
    req.session.token = token;

    res.json({
      message: 'Login successful',
      token,  // Optionally send the token to the frontend as well
    });

  } catch (err) {
    return next(new InternalServerError(err.message));
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
    await admin.save();

     const baseUrl = process.env.ADMIN_LOGIN_URL;
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

    res.json({ message: 'Reset email sent' });
  } catch (err) {
    return next(new InternalServerError(err.message));
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
    await admin.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    return next(new InternalServerError(err.message));
  }
};
