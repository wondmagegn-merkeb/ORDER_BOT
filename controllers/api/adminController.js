const { Admin } = require('../../models/index');
const { NotFoundError, ValidationError, InternalServerError, UnauthorizedError } = require('../../utiles/customError');
const jwt = require('jsonwebtoken');
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
    const { username, email, password, telegramId, role } = req.body;

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
    const newAdmin = await Admin.create({
      adminId,
      username,
      email,
      password,
      telegramId,
      createdBy: 'ADM001',
      role
    });

    res.locals.success = 'Admin added successfully!';
    res.render('admin/add', { title: 'Add Admin' });
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
    const { email, password } = req.body;

    const admin = await Admin.findOne({ where: { email } });
    if (!admin) return next(new NotFoundError('Admin not found'));

    if (admin.password !== password) return next(new UnauthorizedError('Invalid credentials'));

    const token = jwt.sign({ adminId: admin.adminId, role: admin.role }, JWT_SECRET, {
      expiresIn: '1h'
    });

    res.json({ token, admin: { adminId: admin.adminId, username: admin.username, role: admin.role } });
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

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    await sendMail({
      to: admin.email,
      subject: 'Reset Your Password',
      html: `<p>You requested a password reset. <a href="${resetLink}">Click here</a> to reset.</p>`
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
